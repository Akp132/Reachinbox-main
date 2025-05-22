import { Client } from "@elastic/elasticsearch";
import { env } from "../config/env";
import { logger } from "./logger";
import { EmailDoc } from "../models/email.types";

const client = new Client({ node: env.elastic.node });

const INDEX = "emails";

export const ElasticService = {

  async init() {
    const exists = await client.indices.exists({ index: INDEX });
    if (!exists) {
      await client.indices.create({
        index: INDEX,
        mappings: {
          properties: {
            id: { type: "keyword" },
            account: { type: "keyword" },
            folder: { type: "keyword" },
            subject: { type: "text" },
            from: { type: "keyword" },
            to: { type: "keyword" },
            date: { type: "date" },
            text: { type: "text" },
            labels: {
              properties: { ai: { type: "keyword" } },
            },
          },
        },
      });
      logger.info("Created Elasticsearch index 'emails'");
    }
  },

   async checkIfEmailExists(id: string): Promise<boolean> {
    const result = await client.exists({
      index: 'emails',
      id,
    });
    return result;
  },

  async saveEmail(doc: EmailDoc) {
    await client.index({ index: INDEX, id: doc.id, document: doc });
    logger.debug({ id: doc.id }, "Indexed email");
  },

  // Simple full-text + filter search
  async search(q: string, account?: string, folder?: string) {
    const must: any[] = [{ query_string: { query: q || "*" } }];
    if (account) must.push({ term: { account } });
    if (folder) must.push({ term: { folder } });

    const res = await client.search<EmailDoc>({
      index: INDEX,
      query: { bool: { must } },
      size: 50,
    });
    return res.hits.hits.map(h => h._source!);
  },

  async clearIndex() {
    const exists = await client.indices.exists({ index: INDEX });
    if (exists) {
      await client.indices.delete({ index: INDEX });
      logger.info("🗑️ Deleted Elasticsearch index 'emails'");
      await this.init(); // Recreate the index
      logger.info("✅ Recreated Elasticsearch index 'emails'");
    } else {
      logger.warn("⚠️ Tried to clear index but it does not exist.");
    }
  },


};


