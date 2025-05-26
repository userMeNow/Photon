import { Router } from 'express';
import { redis } from './redis';

const router = Router();

router.post('/trigger', async (req, res) => {
  const data = req.body;

  await redis.publish(process.env.REDIS_PUB_CHANNEL!, JSON.stringify(data));
  res.json({ status: 'Request sent to microservice', data });
});

export default router;
