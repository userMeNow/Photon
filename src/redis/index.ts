import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
import { sendMessageToTelegramBot } from "../telegram";

dotenv.config();

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType;
  private isConnecting: boolean = false;
  private connectPromise?: Promise<void>;
  private wasPreviouslyConnected?: boolean = false;
  private lastReconnectNotify?: number = 0;
  private static readonly RECONNECT_NOTIFY_INTERVAL = 2 * 60 * 1000;

  private constructor() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('end', async () => {
      console.group('[RedisService]');
      console.warn('Redis connection ended');
      await sendMessageToTelegramBot(`Redis service disconnected`);
      console.groupEnd();
    });

    this.client.on('reconnecting', async () => {
      console.group('[RedisService]');
      const now = Date.now();

      if (this.lastReconnectNotify === 0 || now - this.lastReconnectNotify >= RedisService.RECONNECT_NOTIFY_INTERVAL) {
        this.lastReconnectNotify = now;
        await sendMessageToTelegramBot(`⚠️ Redis service disconnected, attempting to reconnect...`);
      }
      console.log('Attempting to reconnect to Redis...');
      console.groupEnd();
    });

    this.client.on('ready', async () => {
      //await this.makeSubscribes();
      console.group('[RedisService]');
      this.lastReconnectNotify = 0;
      if (!this.wasPreviouslyConnected) {
        console.log('Redis connected');
        this.wasPreviouslyConnected = true;
      } else {
        await sendMessageToTelegramBot(`Redis service - connection restored`);
        console.log(`Redis service - connection restored`);
      }
      console.groupEnd();
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    if (this.client.isOpen) return;
    if (this.isConnecting) return this.connectPromise!;

    this.isConnecting = true;
    this.connectPromise = this.client.connect()
      .then(async () => {
      })
      .catch((e) => {
        console.group('[RedisService]');
        console.error('Error connecting to Redis:', e.message);
        console.groupEnd();
        throw new Error(`Redis wasn't connected! ${e.message}`);
      });

    return this.connectPromise;
  }

  public getClient(): RedisClientType {
    if (!this.client.isOpen) {
      throw new Error('Redis client not connected. Call connect() first.');
    }
    return this.client;
  }

  public async publish(message: object) {
    console.group('[RedisService]');
    console.log("Sending information to redis")
    await this.client.publish(process.env.REDIS_PUB_CHANNEL!,
      JSON.stringify(message)
    ).then(() => {
      console.log("Send completed");
    }).catch((e) => {
      console.log("Error occurred while sending to redis", e);
    });
    console.groupEnd();
  }

  private async makeSubscribes() {
    console.group('[RedisService]');
    console.log("Subscribing to service");
    await this.client.subscribe(process.env.REDIS_SUB_CHANNEL!, (msg) => {
      console.log('Ответ от микросервиса:', msg);
    }).then(() => {
      console.log("Подписка выполнена");
    }).catch((e) => {
      console.log("Произошла ошибка во время выполнения подписки", e);
    });
    console.groupEnd();
  }
}
