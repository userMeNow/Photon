import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const WebSocket = require("ws");
import { sendMessageToTelegramBot } from './telegram';
import { saveArray } from "./helpers";
import { extractTokenPairs } from './utils/tokenUtils';
import express from 'express';
import mongoose from 'mongoose';
import tokenRoute from './routes/tokenRoute';
import {saveToken} from "./services/tokenService";

const app = express();
const PORT = 3000;

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
  page.on('console', (msg) => console.log('[PAGE]', msg.text()));

  await page.setCookie(
    {
      name: 'cf_clearance',
      value:
        'FRDwQiJAj_oWLJJqlSSprJsEgvFavVijSwGMcBjedK0-1747923227-1.2.1.1-BwS1g4QqnVoiL1pmO3D2N7uFhboChnHLDG_pWxASWar21Le3xUkS_GiaOwZorvaMFH.CayYfMw8HLUqJyblHXw087Xytd6F0Q7ziAgdF0m77nUUqOvQMx48RdXw1C7ASPNi.4OsrBXSTfpTKMsQSzxYCf3k_eVjFKA3fFBQplrQpss6cISKJ9wTz5GE8JIEvniqGfWkywa2MVnq4wUn6TYWfj.7BtES5s1luZnRgTyD7kQ0xTnmGcTuhdKPuaQUtlYHD5qocx6Am8e6sh.OWHsWIMmAJOwaQ8oOFUy.HCcr0L5w3SeebqX7DEhFQmxkUYYihiQ.afBWQtZFJBzs9abwVncvrygGBCxGBGS3iZbMZJMbrBBZoBy_XSfzeslwi',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true,
    },
    {
      name: '__cf_bm',
      value:
        'SB9ubFZgkZcZ8ZOb.T1dNFwQs1l8cij9dHWlDupgpTk-1747928282-1.0.1.1-SQQYGfj_fg9hUm5_7yA_6IblpBD56FKpryAW86Xb9YnbowiDoaiX9_r2ajxfIQW5YSaYkKdMxoBctUgqD9u5.i9RY9kXQ7otGPS1IHSZlaUj.uCxNCszlEUg_sFcfnAR',
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
  await page.exposeFunction('ascii', (data: string[], socketType): void => {
    saveArray(`./pairs/pairs_${socketType}.json`, data);

    const newData = extractTokenPairs(data);
    if (newData?.length) {
      newData.forEach(element => {
        saveToken(element)
      });
      saveArray(`./pairs/out_pairs_${socketType}.json`, newData);
      console.log(`newData_${socketType}`, newData);
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

// ─── kick off ──────────────────────────────────────────────────────────────────
start().catch((err) => console.error(err));

mongoose.connect('mongodb://localhost:27017/tokens')
  .then(() => {
    console.log('MongoDB подключена');
    app.listen(PORT, () => {
      console.log(`Сервер работает на http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err);
  });