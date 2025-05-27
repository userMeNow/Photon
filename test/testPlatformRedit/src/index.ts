import express from 'express';
import dotenv from 'dotenv';
import { initRedis, redis } from './redis';
import api from './api';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/', api);

async function main() {
  await initRedis();
  
  for(const channel of ['5m', '1h', '6h', '24h']){
    await redis.subscribe(process.env.REDIS_SUB_CHANNEL!+channel, (msg) => {
      console.log('Response from microservice:', msg);
    });
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Platform listening on http://localhost:${port}`);
  });
}

main();