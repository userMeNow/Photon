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
  
  await redis.subscribe(process.env.REDIS_SUB_CHANNEL!, (msg) => {
    console.log('Ответ от микросервиса:', msg);
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Платформа слушает на http://localhost:${port}`);
  });
}

main();