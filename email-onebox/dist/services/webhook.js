"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fireInterestedWebhook = fireInterestedWebhook;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
async function fireInterestedWebhook(payload) {
    try {
        await axios_1.default.post(env_1.env.interestedWebhookUrl, payload, {
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (err) {
        logger_1.logger.error({ err }, "External webhook failed");
    }
}
