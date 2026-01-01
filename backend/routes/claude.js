import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/claude/message - Proxy to Cerebras AI
router.post('/message', authenticateToken, async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    // Convert messages format for Cerebras
    const cerebrasMessages = [];

    // Add system prompt as first message
    if (systemPrompt) {
      cerebrasMessages.push({
        role: 'system',
        content: systemPrompt
      });
    }

    // Add conversation messages
    cerebrasMessages.push(...messages);

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: cerebrasMessages,
        max_tokens: 1024,
        temperature: 0.7,
        stream: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cerebras API error:', data);
      return res.status(response.status).json({
        error: data.error?.message || 'Cerebras API error'
      });
    }

    // Return content in same format
    res.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error('Cerebras proxy error:', error);
    res.status(500).json({ error: 'Error calling Cerebras API' });
  }
});

export default router;