import { IncomingWebhook } from "@slack/webhook";
import { env } from "../config/env";

const webhook = new IncomingWebhook(env.slackWebhookUrl);

export const SlackService = {
  async notifyInterested(subject: string, link?: string) {
    await webhook.send({
      text: `📧 *Interested lead*: ${subject}${link ? ` – <${link}|Open>` : ""}`,
    });
  },
};
