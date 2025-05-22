import express, { Request, Response } from "express";
import cors from "cors"; // ✅ Import CORS
import { logger } from "./services/logger";
import { ElasticService } from "./services/elastic";
import { startImapSync } from "./services/imap";

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

  const port = 5070;
  app.listen(port, () => logger.info(`REST API http://localhost:${port}`));
}

main().catch(err => {
  logger.fatal({ err }, "Fatal startup error");
  process.exit(1);
});
