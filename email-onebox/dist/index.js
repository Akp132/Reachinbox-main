"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors")); // ✅ Import CORS
const logger_1 = require("./services/logger");
const elastic_1 = require("./services/elastic");
const imap_1 = require("./services/imap");
async function main() {
    await elastic_1.ElasticService.init();
    (0, imap_1.startImapSync)();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.get("/health", (_, res) => {
        res.send("OK");
    });
    app.get("/emails", async (req, res) => {
        const q = req.query.q ?? "*";
        const account = req.query.account;
        const folder = req.query.folder;
        const hits = await elastic_1.ElasticService.search(q, account, folder);
        res.json(hits);
    });
    const port = 5000;
    app.listen(port, () => logger_1.logger.info(`REST API http://localhost:${port}`));
}
main().catch(err => {
    logger_1.logger.fatal({ err }, "Fatal startup error");
    process.exit(1);
});
