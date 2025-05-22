import { Groq } from 'groq-sdk';
import { queryRelevantPrompt } from './vectorDB';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export async function suggestReply(emailText: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY is not set!');
    throw new Error('Missing Groq API key');
  }

  try {
    const context = await queryRelevantPrompt(emailText);
    console.log('📎 Retrieved context:', context);

    const prompt = `
You are an AI assistant writing helpful, polite email replies.

Context:
${context}

Email:
${emailText}

Write a polite and relevant response. Keep it short and actionable.`;

    const chat = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
    });

    const response = chat.choices?.[0]?.message?.content?.trim();
    console.log('✅ Suggested reply:', response);
    return response || 'No reply generated.';
  } catch (err) {
    console.error('❌ Error in suggestReply:', err);
    throw err;
  }
}
