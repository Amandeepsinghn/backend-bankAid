import { env } from './env';
import { AppError } from '../middleware/error/errorHandler';

interface ZeptoMailAddress {
  address: string;
  name?: string;
}

export async function sendEmail(to: ZeptoMailAddress, subject: string, htmlBody: string): Promise<void> {
  const response = await fetch(env.ZEPTOMAIL_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_API_KEY}`,
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
