"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.env = {
    logLevel: process.env.LOG_LEVEL ?? "info",
    elastic: { node: "http://localhost:9200" },
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    interestedWebhookUrl: process.env.INTERESTED_WEBHOOK_URL,
    groqApiKey: process.env.GROQ_API_KEY,
    // Parse any number of IMAP accounts: ACCOUNT_1_HOST, ACCOUNT_2_HOST…
    imapAccounts: Object.entries(process.env)
        .filter(([k]) => k.startsWith("ACCOUNT_") && k.endsWith("_HOST"))
        .map(([k]) => {
        const prefix = k.replace("_HOST", "");
        return {
            host: process.env[`${prefix}_HOST`],
            port: Number(process.env[`${prefix}_PORT`] ?? 993),
            user: process.env[`${prefix}_USER`],
            pass: process.env[`${prefix}_PASS`],
            tls: (process.env[`${prefix}_TLS`] ?? "true") === "true",
        };
    }),
};
