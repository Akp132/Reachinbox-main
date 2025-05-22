import express, { Request, Response } from "express";
import cors from "cors"; // ✅ Import CORS
import { logger } from "./services/logger";
import { ElasticService } from "./services/elastic";
import { startImapSync } from "./services/imap";
import replyRouter from './routes/reply';

async function main() {
  await ElasticService.init();
  startImapSync();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_: Request, res: Response) => {
    res.send("OK");
  });

  app.get("/emails", async (req: Request, res: Response) => {
    const q = (req.query.q as string) ?? "*";
    const account = req.query.account as string | undefined;
    const folder = req.query.folder as string | undefined;
    const hits = await ElasticService.search(q, account, folder);
    res.json(hits);
  });

  app.delete('/emails', async (_req: Request, res: Response) => {
    try {
      await ElasticService.clearIndex();
      res.json({ message: 'Emails index cleared.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to clear emails index' });
    }
  });

  // ✅ Hard test route to verify POST body parsing and routing
  app.post("/test", (req: Request, res: Response) => {
    console.log("🔥 /test route hit:", req.body);
    res.json({ ok: true, received: req.body });
  });

  // ✅ Mount AI reply router
  app.use("/", replyRouter);

  const port = 5070;
  app.listen(port, () => logger.info(`REST API http://localhost:${port}`));
}

main().catch(err => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
