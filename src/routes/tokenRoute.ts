import express, { Request, Response } from 'express';
import { getTokens } from '../services/tokenService';

const router = express.Router();

router.get('/tokens', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const tokens = await getTokens(limit, offset);
    res.json(tokens);
  } catch (err) {
    res.status(500).json({ error: 'Error getting tokens' });
  }
});

export default router;
