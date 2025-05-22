"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startImapSync = startImapSync;
const imapflow_1 = require("imapflow");
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const uuid_1 = require("uuid");
const elastic_1 = require("./elastic");
const aiCategorizer_1 = require("./aiCategorizer");
const slack_1 = require("./slack");
const webhook_1 = require("./webhook");
async function buildEmailDoc(msg, account, folder) {
    const rawSource = msg.source ? await msg.source : Buffer.from("");
    const text = rawSource.toString("utf8");
    const subject = msg.envelope?.subject ?? "(no-subject)";
    const from = msg.envelope?.from?.map((a) => a?.address ?? "").join(",") ?? "";
    const to = msg.envelope?.to?.map((a) => a?.address ?? "").join(",") ?? "";
    const date = msg.envelope?.date ?? new Date();
    return {
        id: (0, uuid_1.v4)(),
        account,
        folder,
        subject,
        from,
        to,
        date: date.toISOString(),
        text,
        labels: { ai: "Unlabelled" },
    };
}
async function startImapSync() {
    for (const acc of env_1.env.imapAccounts) {
        const opts = {
            host: acc.host,
            port: acc.port,
            secure: acc.tls,
            auth: { user: acc.user, pass: acc.pass },
        };
        const client = new imapflow_1.ImapFlow(opts);
        client.on("error", (err) => logger_1.logger.error({ err }, `[${acc.user}] IMAP error`));
        (async () => {
            await client.connect();
            logger_1.logger.info(`IMAP connected: ${acc.user}`);
            await client.mailboxOpen("INBOX", { readOnly: false });
            const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
            for await (const message of client.fetch({ since }, { envelope: true, source: true, uid: true, flags: true })) {
                await processMessage(message, acc.user, "INBOX");
            }
            while (true) {
                const idleSuccess = await client.idle();
                if (idleSuccess) {
                    const status = await client.status("INBOX", { unseen: true });
                    if ((status.unseen ?? 0) > 0) {
                        const messages = client.fetch({ seen: false }, { envelope: true, source: true });
                        for await (const msg of messages) {
                            await processMessage(msg, acc.user, "INBOX");
                        }
                    }
                }
            }
        })();
    }
}
async function processMessage(message, account, folder) {
    const doc = await buildEmailDoc(message, account, folder);
    const category = await (0, aiCategorizer_1.categorizeEmail)(doc.text);
    doc.labels.ai = category;
    // 🔍 Add preview log here
    logger_1.logger.info({
        subject: doc.subject,
        label: category,
        preview: doc.text.slice(0, 100),
    });
    await elastic_1.ElasticService.saveEmail(doc);
    if (category === "Interested") {
        await slack_1.SlackService.notifyInterested(doc.subject);
        await (0, webhook_1.fireInterestedWebhook)({
            subject: doc.subject,
            id: doc.id,
            category,
        });
    }
    logger_1.logger.info({ subject: doc.subject, label: doc.labels.ai }, `[${account}] stored & tagged`);
}
