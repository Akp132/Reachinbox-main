import * as dotenv from "dotenv";
dotenv.config();

export const env = {
  logLevel: process.env.LOG_LEVEL ?? "info",
  elastic: { node: "http://localhost:9200" },

  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL!,
  interestedWebhookUrl: process.env.INTERESTED_WEBHOOK_URL!,

  groqApiKey: process.env.GROQ_API_KEY!,

  // Parse any number of IMAP accounts: ACCOUNT_1_HOST, ACCOUNT_2_HOST…
  imapAccounts: Object.entries(process.env)
    .filter(([k]) => k.startsWith("ACCOUNT_") && k.endsWith("_HOST"))
    .map(([k]) => {
      const prefix = k.replace("_HOST", "");
      return {
        host: process.env[`${prefix}_HOST`]!,
        port: Number(process.env[`${prefix}_PORT`] ?? 993),
        user: process.env[`${prefix}_USER`]!,
        pass: process.env[`${prefix}_PASS`]!,
        tls: (process.env[`${prefix}_TLS`] ?? "true") === "true",
      };
    }),
};
