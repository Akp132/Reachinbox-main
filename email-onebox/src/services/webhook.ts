import axios from "axios";
import { env } from "../config/env";
import { logger } from "./logger";

export async function fireInterestedWebhook(payload: any) {
  try {
    await axios.post(env.interestedWebhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    logger.error({ err }, "External webhook failed");
  }
}
