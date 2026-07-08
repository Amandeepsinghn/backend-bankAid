import { env } from './env';
import { AppError } from '../middleware/error/errorHandler';

interface ZeptoMailAddress {
  address: string;
  name?: string;
}

// Accepts either the bare token or the full "Zoho-enczapikey <token>" string
// (the ZeptoMail dashboard shows keys with the prefix already attached, so
// it's easy to paste it into .env either way) — normalizing here means a
// missing or doubled prefix can never silently break auth.
function buildAuthHeader(rawKey: string): string {
  const token = rawKey.replace(/^Zoho-enczapikey\s+/i, '').trim();
  return `Zoho-enczapikey ${token}`;
}

export async function sendEmail(to: ZeptoMailAddress, subject: string, htmlBody: string): Promise<void> {
  const response = await fetch(env.ZEPTOMAIL_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: buildAuthHeader(env.ZEPTOMAIL_API_KEY),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: env.ZEPTOMAIL_FROM_EMAIL, name: env.ZEPTOMAIL_FROM_NAME },
      to: [{ email_address: to }],
      subject,
      htmlbody: htmlBody,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AppError(502, `Failed to send email via ZeptoMail: ${response.status} ${detail}`);
  }
}
