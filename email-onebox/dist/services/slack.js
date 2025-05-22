"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const webhook_1 = require("@slack/webhook");
const env_1 = require("../config/env");
const webhook = new webhook_1.IncomingWebhook(env_1.env.slackWebhookUrl);
exports.SlackService = {
    async notifyInterested(subject, link) {
        await webhook.send({
            text: `📧 *Interested lead*: ${subject}${link ? ` – <${link}|Open>` : ""}`,
        });
    },
};
