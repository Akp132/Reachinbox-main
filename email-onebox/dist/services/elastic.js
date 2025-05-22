"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticService = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const client = new elasticsearch_1.Client({ node: env_1.env.elastic.node });
const INDEX = "emails";
exports.ElasticService = {
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
            logger_1.logger.info("Created Elasticsearch index 'emails'");
        }
    },
    async saveEmail(doc) {
        await client.index({ index: INDEX, id: doc.id, document: doc });
        logger_1.logger.debug({ id: doc.id }, "Indexed email");
    },
    // Simple full-text + filter search
    async search(q, account, folder) {
        const must = [{ query_string: { query: q || "*" } }];
        if (account)
            must.push({ term: { account } });
        if (folder)
            must.push({ term: { folder } });
        const res = await client.search({
            index: INDEX,
            query: { bool: { must } },
            size: 50,
        });
        return res.hits.hits.map(h => h._source);
    },
};
