import { ChromaClient } from 'chromadb';

const client = new ChromaClient();
const collectionName = 'reply-prompts';

export async function setupVectorDB() {
  await client.deleteCollection({ name: collectionName }).catch(() => {});
  const collection = await client.createCollection({ name: collectionName });

  await collection.add({
    ids: ['1', '2'],
    metadatas: [
      { category: 'interview' },
      { category: 'job-application' }
    ],
    documents: [
      'If the lead is interested, share the meeting booking link: https://cal.com/example',
      'You are applying for a job and they respond positively. Politely thank them and ask for next steps.',
    ]
  });

  console.log('✅ Vector DB initialized');
  return collection;
}

export async function queryRelevantPrompt(emailText: string): Promise<string> {
  const collection = await client.getCollection({ name: collectionName });

  const results = await collection.query({
    queryTexts: [emailText],
    nResults: 1,
  });

  return results.documents?.[0]?.[0] || '';
}
