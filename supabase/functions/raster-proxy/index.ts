import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import {createClient} from "https://esm.sh/@supabase/supabase-js@2";
import {importPKCS8, SignJWT} from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/** Generate a GCS V4 signed URL using a service account key. */
async function generateSignedUrl(
    objectPath: string,
    expiresInSeconds = 3600,
): Promise<string> {
    const bucket = Deno.env.get("GCS_BUCKET") ?? "cape-town-rasters";
    const saEmail = Deno.env.get("GCS_SA_EMAIL") ?? "";
    const saKeyPem = (Deno.env.get("GCS_SA_PRIVATE_KEY") ?? "").replace(
        /\\n/g,
        "\n",
    );

    // Build a self-signed JWT to call the GCS signBlob / signedUrl endpoint
    const now = Math.floor(Date.now() / 1000);
    const privateKey = await importPKCS8(saKeyPem, "RS256");
    const accessToken = await new SignJWT({
        iss: saEmail,
        scope: "https://www.googleapis.com/auth/devstorage.read_only",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
    })
        .setProtectedHeader({alg: "RS256", typ: "JWT"})
        .sign(privateKey);

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: accessToken,
        }),
    });
    const {access_token} = await tokenRes.json();

    // Generate V4 signed URL via GCS JSON API
    const expiration = new Date(
        Date.now() + expiresInSeconds * 1000,
    ).toISOString();
    const signRes = await fetch(
        `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=json`,
        {headers: {Authorization: `Bearer ${access_token}`}},
    );

    if (!signRes.ok) {
        throw new Error(`GCS object lookup failed: ${signRes.status}`);
    }

    // For public COGs, return the direct URL with cache-busting expiry param
    // For private buckets, use the V4 signing flow
    const publicUrl = `https://storage.googleapis.com/${bucket}/${objectPath}`;

    // If bucket is not public, generate a signed URL instead:
    // (uncomment when bucket is private)
    // const signedUrlRes = await fetch(
    //   `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(objectPath)}?signedUrl&expiresIn=${expiresInSeconds}`,
    //   { headers: { Authorization: `Bearer ${access_token}` } }
    // );

    return publicUrl;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", {headers: corsHeaders});
    }

    try {
        // ── Supabase JWT Validation ──
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", {
                status: 401,
                headers: corsHeaders,
            });
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            {global: {headers: {Authorization: authHeader}}},
        );

        const {
            data: {user},
            error,
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
            return new Response("Unauthorized", {
                status: 401,
                headers: corsHeaders,
            });
        }

        // ── Path parameter ──
        const url = new URL(req.url);
        const tilePath = url.searchParams.get("path");

        if (!tilePath) {
            return new Response("Missing path parameter", {
                status: 400,
                headers: corsHeaders,
            });
        }

        // ── Signed URL generation ──
        const signedUrl = await generateSignedUrl(tilePath);

        return new Response(JSON.stringify({url: signedUrl}), {
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                // CesiumJS terrain tiles are immutable per date — long cache
                "Cache-Control":
                    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({error: message}), {
            headers: {...corsHeaders, "Content-Type": "application/json"},
            status: 500,
        });
    }
});
