"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSlackNotification = sendSlackNotification;
exports.triggerWebhook = triggerWebhook;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const EXTERNAL_WEBHOOK_URL = process.env.EXTERNAL_WEBHOOK_URL;
async function sendSlackNotification(subject, from) {
    try {
        await axios_1.default.post(SLACK_WEBHOOK_URL, {
            text: `📩 New *Interested* Email\n*Subject:* ${subject}\n*From:* ${from}`,
        });
        console.log(`[Slack] Notified: ${subject}`);
    }
    catch (err) {
        if (err instanceof Error) {
            console.error(`[Slack] Notification failed:`, err.message);
        }
        else {
            console.error(`[Slack] Notification failed:`, err);
        }
    }
}
async function triggerWebhook(emailData) {
    try {
        await axios_1.default.post(EXTERNAL_WEBHOOK_URL, emailData);
        console.log(`[Webhook] Triggered: ${emailData.subject}`);
    }
    catch (err) {
        if (err instanceof Error) {
            console.error(`[Webhook] Failed:`, err.message);
        }
        else {
            console.error(`[Webhook] Failed:`, err);
        }
    }
}
