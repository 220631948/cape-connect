import { Resend } from 'resend';

// Initialize Resend with the API key
// If the key is missing, it will log a warning.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// The default from address, can be configured via env var
const defaultFromAddress = process.env.EMAIL_FROM_ADDRESS || 'CapeGIS <noreply@capegis.com>';

export async function sendInvitationEmail(
  email: string,
  role: string,
  invitationLink: string
): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY is not set. Skipping sending actual email.');
    console.warn(`[Email] Would have sent invitation to ${email} (Role: ${role}) with link: ${invitationLink}`);
    // In development or when unconfigured, pretend it succeeded so the flow doesn't break
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: defaultFromAddress,
      to: email,
      subject: 'You have been invited to CapeGIS',
      html: getInvitationHtmlTemplate(email, role, invitationLink),
    });

    if (error) {
      console.error('[Email] Failed to send invitation email via Resend:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Email] Unexpected error sending invitation email:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

function getInvitationHtmlTemplate(email: string, role: string, invitationLink: string): string {
  // Dark dashboard theme with near-black backgrounds and 'crayon' accents (#FF6B6B / #4ECDC4 / #FFE66D / #FF8C42)
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to CapeGIS</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0A0A0A;
      color: #E5E5E5;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #111111;
      border: 1px solid #333333;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background-color: #1A1A1A;
      padding: 24px;
      text-align: center;
      border-bottom: 2px solid #FF6B6B; /* Crayon accent */
    }
    .header h1 {
      margin: 0;
      color: #FFFFFF;
      font-size: 24px;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px;
    }
    .content p {
      margin-bottom: 20px;
      font-size: 16px;
    }
    .role-badge {
      display: inline-block;
      background-color: #333333;
      color: #4ECDC4; /* Crayon accent */
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      background-color: #FF6B6B; /* Crayon accent */
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #FF5252;
    }
    .footer {
      background-color: #1A1A1A;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #888888;
      border-top: 1px solid #333333;
    }
    .link-fallback {
      font-size: 12px;
      word-break: break-all;
      color: #888888;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CapeGIS Hub</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been invited to join <strong>CapeGIS</strong>, the spatial property intelligence platform for the City of Cape Town and Western Cape Province.</p>

      <div>
        <span class="role-badge">Role: ${role}</span>
      </div>

      <p>Please click the button below to accept your invitation and set up your account. This invitation link will expire in 7 days.</p>

      <div class="button-container">
        <a href="${invitationLink}" class="button">Accept Invitation</a>
      </div>

      <div class="link-fallback">
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${invitationLink}</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} CapeGIS. All rights reserved.<br>
      This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>
  `;
}
