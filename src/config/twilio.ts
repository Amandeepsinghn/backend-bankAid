import Twilio from 'twilio';
import { env } from './env';

export const twilioClient = Twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
