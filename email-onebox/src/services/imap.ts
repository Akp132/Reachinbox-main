import { ImapFlow, ImapFlowOptions, FetchMessageObject } from "imapflow";
import { env } from "../config/env";
import { logger } from "./logger";
import { v4 as uuid } from "uuid";
import { ElasticService } from "./elastic";
import { categorizeEmail } from "./aiCategorizer";
import { SlackService } from "./slack";
import { fireInterestedWebhook } from "./webhook";
import { EmailDoc, EmailCategory } from "../models/email.types";
import { simpleParser } from "mailparser";  // ✅ New import

type Message = FetchMessageObject;

async function buildEmailDoc(
  msg: Message,
  account: string,
  folder: string
): Promise<EmailDoc> {
  const rawSource = msg.source ? await msg.source : Buffer.from("");

  // ✅ Use mailparser to extract clean body
  const parsed = await simpleParser(rawSource);
  const text = parsed.text?.trim() || (typeof parsed.html === 'string' ? parsed.html.replace(/<[^>]+>/g, '').trim() : "(No content)");


  const subject = msg.envelope?.subject ?? "(no-subject)";
  const from = msg.envelope?.from?.map((a: any) => a?.address ?? "").join(",") ?? "";
  const to = msg.envelope?.to?.map((a: any) => a?.address ?? "").join(",") ?? "";
  const date = msg.envelope?.date ?? new Date();

  return {
    id: uuid(),
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

export async function startImapSync(): Promise<void> {
  for (const acc of env.imapAccounts) {
    const opts: ImapFlowOptions = {
      host: acc.host,
      port: acc.port,
      secure: acc.tls,
      auth: { user: acc.user, pass: acc.pass },
    };

    const client = new ImapFlow(opts);

    client.on("error", (err: Error) =>
      logger.error({ err }, `[${acc.user}] IMAP error`)
    );

    (async () => {
      await client.connect();
      logger.info(`IMAP connected: ${acc.user}`);

      await client.mailboxOpen("INBOX", { readOnly: false });

      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      for await (const message of client.fetch(
        { since },
        { envelope: true, source: true, uid: true, flags: true }
      )) {
        await processMessage(message, acc.user, "INBOX");
      }

      while (true) {
        const idleSuccess = await client.idle();
        if (idleSuccess) {
          const status = await client.status("INBOX", { unseen: true });
          if ((status.unseen ?? 0) > 0) {
            const messages = client.fetch(
              { seen: false },
              { envelope: true, source: true }
            );
            for await (const msg of messages) {
              await processMessage(msg, acc.user, "INBOX");
            }
          }
        }
      }
    })();
  }
}

async function processMessage(
  message: Message,
  account: string,
  folder: string
): Promise<void> {
  const doc = await buildEmailDoc(message, account, folder);
  const category: EmailCategory = await categorizeEmail(doc.text);
  doc.labels.ai = category;

  logger.info({
    subject: doc.subject,
    label: category,
    preview: doc.text.slice(0, 100),
  });

  await ElasticService.saveEmail(doc);

  if (category === "Interested") {
    await SlackService.notifyInterested(doc.subject);
    await fireInterestedWebhook({
      subject: doc.subject,
      id: doc.id,
      category,
    });
  }

  logger.info(
    { subject: doc.subject, label: doc.labels.ai },
    `[${account}] stored & tagged`
  );
}
