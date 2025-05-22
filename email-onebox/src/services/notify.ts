import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL!;
const EXTERNAL_WEBHOOK_URL = process.env.EXTERNAL_WEBHOOK_URL!;

export async function sendSlackNotification(subject: string, from: string) {
  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: `📩 New *Interested* Email\n*Subject:* ${subject}\n*From:* ${from}`,
    });
    console.log(`[Slack] Notified: ${subject}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`[Slack] Notification failed:`, err.message);
    } else {
      console.error(`[Slack] Notification failed:`, err);
    }
  }
}

export async function triggerWebhook(emailData: any) {
  try {
    await axios.post(EXTERNAL_WEBHOOK_URL, emailData);
    console.log(`[Webhook] Triggered: ${emailData.subject}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`[Webhook] Failed:`, err.message);
    } else {
      console.error(`[Webhook] Failed:`, err);
    }
  }
}
