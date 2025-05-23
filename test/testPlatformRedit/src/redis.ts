import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redis = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

export async function initRedis() {
  await redis.connect();
}
