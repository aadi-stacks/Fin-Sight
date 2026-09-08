import { Router, Request, Response } from 'express';
import { generateFactBasedExplanation, VerifiedFinancialFacts } from '../services/aiService';

const router = Router();

router.post('/explain', async (req: Request, res: Response) => {
  try {
    const { facts, question } = req.body;

    if (!facts || typeof facts !== 'object') {
      return res.status(400).json({
        error: 'Missing required verified financial facts payload in request body.',
      });
    }

    const result = await generateFactBasedExplanation(facts as VerifiedFinancialFacts, question);

    return res.json({
      explanation: result.explanation,
      isFallback: result.isFallback,
      verifiedFacts: facts,
    });
  } catch (err: any) {
    console.error('Error in /api/insights/explain router:', err);
    return res.status(500).json({
      error: 'Failed to generate AI explanation.',
      details: err.message,
    });
  }
});

export default router;
