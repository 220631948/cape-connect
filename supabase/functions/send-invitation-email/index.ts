// @ts-ignore Deno import is valid in Edge runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { invitation_id, email, role, tenant_name, invite_url } = await req.json();

    // Validate inputs
    if (!invitation_id || !email || !invite_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Sending invitation to ${email} for role ${role} in ${tenant_name}`);
    console.log(`Link: ${invite_url}`);

    // In a real environment, this would use Resend, SendGrid, or AWS SES
    // Example:
    // const res = await fetch('https://api.resend.com/emails', { ... })
    // if (!res.ok) throw new Error('Email failed to send');

    // Simulate successful email dispatch
    return new Response(
      JSON.stringify({ success: true, message: `Email accepted for ${email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
