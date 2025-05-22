import { ImapFlow, ImapFlowOptions, FetchMessageObject } from 'imapflow';
import { simpleParser } from 'mailparser';
import { createHash } from 'crypto';
import { categorizeEmail } from './aiCategorizer';
import { ElasticService } from './elastic';
import { SlackService } from './slack';
import { fireInterestedWebhook } from './webhook';
import { EmailDoc, EmailCategory } from '../models/email.types';
import { logger } from './logger';

function parseBool(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

const envAccounts = [
  {
    host: process.env.ACCOUNT_1_HOST!,
    port: parseInt(process.env.ACCOUNT_1_PORT || '993'),
    tls: parseBool(process.env.ACCOUNT_1_TLS),
    user: process.env.ACCOUNT_1_USER!,
    pass: process.env.ACCOUNT_1_PASS!,
  },
  {
    host: process.env.ACCOUNT_2_HOST!,
    port: parseInt(process.env.ACCOUNT_2_PORT || '993'),
    tls: parseBool(process.env.ACCOUNT_2_TLS),
    user: process.env.ACCOUNT_2_USER!,
    pass: process.env.ACCOUNT_2_PASS!,
  },
];

function generateDeterministicId(account: string, folder: string, uid: number): string {
  return createHash('sha256').update(`${account}:${folder}:${uid}`).digest('hex');
}

async function buildEmailDoc(
  msg: FetchMessageObject,
  account: string,
  folder: string
): Promise<EmailDoc> {
  const rawSource = msg.source ? await msg.source : Buffer.from('');
  const parsed = await simpleParser(rawSource);

  const text =
    parsed.text?.trim() ||
    (typeof parsed.html === 'string'
      ? parsed.html.replace(/<[^>]+>/g, '').trim()
      : '(No content)');

  const subject = msg.envelope?.subject ?? '(no-subject)';
  const from = msg.envelope?.from?.map((a: any) => a?.address ?? '').join(',') ?? '';
  const to = msg.envelope?.to?.map((a: any) => a?.address ?? '').join(',') ?? '';
  const date = msg.envelope?.date ?? new Date();

  const uid = msg.uid!;
  const id = generateDeterministicId(account, folder, uid);

  return {
    id,
    account,
    folder,
    subject,
    from,
    to,
    date: date.toISOString(),
    text,
    labels: { ai: 'Unlabelled' },
  };
}

async function processMessage(
  message: FetchMessageObject,
  account: string,
  folder: string
): Promise<void> {
  const uid = message.uid!;
  const id = generateDeterministicId(account, folder, uid);

  const alreadyExists = await ElasticService.checkIfEmailExists(id);
  if (alreadyExists) {
    logger.info({ id }, '⏭️ Skipping duplicate email');
    return;
  }

  const doc = await buildEmailDoc(message, account, folder);
  const raw = await categorizeEmail(doc.text);

  const allowed: EmailCategory[] = [
    'Interested',
    'Meeting Booked',
    'Not Interested',
    'Spam',
    'Out of Office',
    'Unlabelled',
  ];

  const category: EmailCategory = allowed.includes(raw as EmailCategory)
    ? (raw as EmailCategory)
    : 'Unlabelled';

  doc.labels.ai = category;

  logger.info({
    subject: doc.subject,
    label: category,
    preview: doc.text.slice(0, 100),
  });

  await ElasticService.saveEmail(doc);

  if (category === 'Interested') {
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

export async function startImapSync(): Promise<void> {
  for (const acc of envAccounts) {
    const opts: ImapFlowOptions = {
      host: acc.host,
      port: acc.port,
      secure: acc.tls,
      auth: { user: acc.user, pass: acc.pass },
    };

    const client = new ImapFlow(opts);

    client.on('error', (err: Error) =>
      logger.error({ err }, `[${acc.user}] IMAP error`)
    );

    (async () => {
      await client.connect();
      logger.info(`📬 IMAP connected: ${acc.user}`);

      await client.mailboxOpen('INBOX', { readOnly: false });

      // 🔄 Fetch recent emails in reverse order (most recent first)
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      const status = await client.status('INBOX', { uidNext: true });
      const latestUid = (status.uidNext ?? 1) - 1;

      for (let uid = latestUid; uid > 0; uid--) {
        const uidStr = String(uid); // Fix for type error
        const msg = await client.fetchOne(uidStr, {
          envelope: true,
          source: true,
          uid: true,
          flags: true,
        });
        if (!msg) continue;
        if (msg.envelope?.date && msg.envelope.date < since) break;

        await processMessage(msg, acc.user, 'INBOX');
      }

      // 🔁 IDLE: Real-time sync
      while (true) {
        const idleSuccess = await client.idle();
        if (idleSuccess) {
          const status = await client.status('INBOX', { unseen: true });
          if ((status.unseen ?? 0) > 0) {
            const messages = client.fetch(
              { seen: false },
              { envelope: true, source: true, uid: true }
            );
            for await (const msg of messages) {
              await processMessage(msg, acc.user, 'INBOX');
            }
          }
        }
      }
    })();
  }
}
