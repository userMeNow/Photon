import dotenv from 'dotenv';
dotenv.config();
import {validateEnv} from "./utils/env";

validateEnv()

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const WebSocket = require("ws");
import { sendMessageToTelegramBot } from './telegram';
import { saveArray } from "./helpers";
import { extractTokenPairs } from './utils/tokenUtils';
import express from 'express';
import mongoose from 'mongoose';
import tokenRoute from './routes/tokenRoute';
import { saveToken } from "./services/tokenService";
import { RedisService } from './redis';

const app = express();
const PORT = 3000;
const logBrowser = process.env.LOG_BROWSER;

app.use(express.json());
app.use('/', tokenRoute);
// ─── puppeteer setup ────────────────────────────────────────────────────────────
puppeteer.use(StealthPlugin());

const wsClients = new Set<WebSocket>();

const start = async (): Promise<void> => {
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './chrome-profile',
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  if (logBrowser) {
    page.on('console', (msg) => console.log('[PAGE]', msg.text()));
  }

  await page.setCookie(
    {
      name: 'cf_clearance',
      value:
        'fJyymWl8UrU1pwjN5mJ.bFJMBwBPf0Q74R.TOOe3coA-1748022813-1.2.1.1-DqBKpRJALoBIttQv15jVzKXR1fwbBX.MXguGp8AN1Mf9V3lcSheU8nuAkKQQ.PeaEKRIJ2UOdfYQXqOiqEaMrR35vfJKj4Wqb5Cy2PB6dxUtgr_u5VqD2Qfto9J2pBBlNdv7ct.llG8gnSfvMnYrts4tLEtLah4i9UMfTIqOi0Mt5H5WCicvJUVLAGfiWX4ALN8rLYdOA5G_mdtYSBRACum_sm_dm9gOuu9qTWsiv.fGwmKvW0zySvDRm.AVw1Yv0LbC7fPTDwNTykJKe9o9vdZ8HNuWsbVyo_btM6DUKnmvlILosVx9qC0NeLhDw5vIvvueSIg_0YFoBWII.D_bjaqyrAnhLRcJmIGFtEwGy2BWefER3GgimvsPdHfKdZMd',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
    {
      name: '__cf_bm',
      value:
        'nqYASfWI5rsef1uh929g_oKcdPLG4ztukGg.2s2158M-1748022810-1.0.1.1-KM8quQ1sCojSok9_0Og1.tKvvCLq8DMd4fv4DYJk24fn8XZtFyAANsA1FF2F.ntwk1Ewyu.8A5P1_vprRdoyqTVF8Sb_GvGkZqBytRiixsUcBS7eMTZqhc4K4_NCq3lc',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true,
    }
  );

  async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await page.keyboard.type('site:example.com');
  await page.keyboard.press('Enter');
  await sleep(2000);

  await page.goto('https://dexscreener.com', {
    waitUntil: 'networkidle2',
    timeout: 0,
  });

  // ─── expose fn for browser → node ─────────────────────────────────────────────
  await page.exposeFunction('ascii', async (data: string[], socketType): Promise<void> => {
    saveArray(`./pairs/pairs_${socketType}.json`, data);//сохраняем в файл последний результат

    const newData = extractTokenPairs(data);
    if (newData?.length) {
      newData.forEach(element => {//сохраняем в базу данных последний результат
        saveToken(element)
      });
      await RedisService.getInstance().publish(newData);
      saveArray(`./pairs/out_pairs_${socketType}.json`, newData);//сохраняем в файл последний конвертированный результат
      //console.log(`newData_${socketType}`, newData);
    }
  });

  // ─── browser-side WS sniffer ──────────────────────────────────────────────────
  await page.evaluate(() => {
    const onOpenHandler = (socketType) => () => {
      console.log(`Socket connection was setted for socket type - ${socketType}`)
    }

    const onMessageHandler = (socketType) => async (msg) => {
      try {
        function extractAsciiStrings(
          bytes: Uint8Array,
          minLength = 4
        ): string[] {
          let str = '';
          const results: string[] = [];
          for (const b of bytes) {
            if (b >= 32 && b <= 126) {
              str += String.fromCharCode(b);
            } else {
              if (str.length >= minLength) results.push(str);
              str = '';
            }
          }
          if (str.length >= minLength) results.push(str);
          return results;
        }

        const dataMsg = msg.data;
        if (dataMsg instanceof Blob) {
          const buffer = await dataMsg.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          console.log('📦 Blob / Binary (first 32 bytes):', [
            ...bytes.slice(0, 32),
          ]);
          const hexDump = [...bytes.slice(0, 32)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' ');
          console.log('🧪 Hex dump:', hexDump);

          // @ts-ignore – функция пришла из exposeFunction
          window.ascii(extractAsciiStrings(bytes), socketType);
        }
      } catch (e: any) {
        console.log(`e.message, socket type - ${socketType}:`, e.message);
        await sendMessageToTelegramBot(`Ошибка расшифровки ответа от сокетов с фильтром ${socketType}: ${e.message}`);
      }
    }

    const onErrorHandler = (socketType) => async (err) => {
      console.log(`WebSocket error, socket type - ${socketType}:`, err);
      await sendMessageToTelegramBot(`Не удалось подключиться к сокетам с фильтром ${socketType} - ${err}`);
    };

    const onCloseHandler = (socketType) => async (event) => {
      console.log(`WebSocket closed, socket type - ${socketType}:`, event.code, event.reason);
      await sendMessageToTelegramBot(`Соединение закрыто для сокета с фильтром ${socketType}: ${event.code} ${event.reason || ''}`);
    };

    const arrayTrendingScore = [
      "M5",
      "H1",
      "H6",
      "H24",
    ]
    const score = arrayTrendingScore[0];
    const wsh = new WebSocket(
      `wss://io.dexscreener.com/dex/screener/v5/pairs/h24/1?rankBy[key]=trendingScore${score}&rankBy[order]=desc&filters[chainIds][0]=solana`
    );

    wsh.onopen = onOpenHandler(score);

    wsh.onerror = onErrorHandler(score);

    wsh.onclose = onCloseHandler(score)

    wsh.onmessage = onMessageHandler(score)
  });
};

// ─── local WS broadcaster ───────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: 6969 });
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

mongoose.connect('mongodb://localhost:27017/tokens')//запуск монго
  .then(async () => {
    try {
      console.log('MongoDB подключена');
      app.listen(PORT, () => {
        console.log(`Сервер работает на http://localhost:${PORT}`);
      });
      await RedisService.getInstance().connect();//запуск редис
      await start();//запуск браузера
    } catch(e) {
      console.log(`Ошибка во время старта проекта: ${e.message}`);
    }
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err);
  });