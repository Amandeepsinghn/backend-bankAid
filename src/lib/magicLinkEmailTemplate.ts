interface MagicLinkEmailOptions {
  checkoutUrl: string;
  expiryMinutes: number;
}

// Inline-styled, table-based layout mirroring otpEmailTemplate.ts's design system —
// kept as its own file/template rather than parameterizing the OTP one, since this
// email carries a link (not a code) and serves a different, non-auth purpose.
export function renderMagicLinkEmail({ checkoutUrl, expiryMinutes }: MagicLinkEmailOptions): string {
  const year = new Date().getFullYear();

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#F2F4F7;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#FFFFFF;border-radius:12px;border:1px solid #DDE1E9;">
            <tr>
              <td style="background-color:#0F1F3D;padding:28px 32px;border-radius:12px 12px 0 0;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:8px;">Account Unfreeze Assistant</div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">Unfreeze</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#0F1F3D;">Continue to payment</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#3A4B6B;">
                  You requested to unlock letter generation. Tap the button below to open the secure
                  checkout page — your account is already identified, so there's nothing else to fill in.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td align="center" style="border-radius:8px;background-color:#2450C8;">
                      <a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:8px;">Choose your plan</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#8A97B0;">This link expires in ${expiryMinutes} minutes and can only be used once.</p>
                <p style="margin:0;font-size:13px;line-height:20px;color:#8A97B0;">If you didn't request this, you can safely ignore this email.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #DDE1E9;font-family:Arial,Helvetica,sans-serif;">
                <p style="margin:0;font-size:12px;color:#8A97B0;">&copy; ${year} Unfreeze. This is an automated message — please don't reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
