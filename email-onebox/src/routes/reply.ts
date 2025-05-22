import express from 'express';
import type { Request, Response } from 'express';
import { suggestReply } from '../services/aiReply';

const router = express.Router();

// ✅ Define the handler separately
async function handleSuggestReply(req: Request, res: Response): Promise<void> {
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const reply = await suggestReply(prompt);
    res.json({ reply });
  } catch (err) {
    console.error('Suggest reply error:', err);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
}

// ✅ Use named function here
router.post('/suggest-reply', handleSuggestReply);

export default router;
