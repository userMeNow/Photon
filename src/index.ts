// index.ts
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const WebSocket = require('ws');
import fs from 'fs';
import path from 'path';
import { sendMessageToTelegramBot } from './telegram';

// ─── helpers ────────────────────────────────────────────────────────────────────
export function saveArray(
  filePath: string,
  arr: unknown[] | Record<string, unknown>,
  append = false
): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const json = JSON.stringify(arr, null, 2);

  append
    ? fs.appendFileSync(filePath, json + '\n')
    : fs.writeFileSync(filePath, json);

  console.log(
    `💾  saved ${Array.isArray(arr) ? arr.length + ' items' : ''} -> ${filePath}`
  );
}

// ─── puppeteer setup ────────────────────────────────────────────────────────────
puppeteer.use(StealthPlugin());

const wsClients = new Set<WebSocket>();

interface TokenPair {
  network: string;
  dex: string;
  poolAddress: string;
  token1: string;
  token2: string;
  name: string;
  symbol: string;
  quoteSymbol: string;
  priceSol: string;
  priceUsd: string;
}

const start = async (): Promise<void> => {
  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: './chrome-profile',
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('[PAGE]', msg.text()));

  // await page.setCookie(
  //   {
  //     name: 'cf_clearance',
  //     value:
  //       'VPWuvQsn5gwFtTyyHi8qqXU4EV0Jna63jyZg9Hy8k8w-1747835015-1.2.1.1-1OBO5tHpRc.2_JwL7mIfF3TapXOwxXwTZW_AAGbu_.ijO8dSxN_z44DqIgkmoZUDjZd4R0bbKJIrjZ6dOmmAgIqw7Q914ycGZJlStOv80eBXosZ9VS41Hva3_7ub4Ai6YbV.Ie8D_ZgIgu0y7IJyFFXmQiu8Wbp.IeKNfcBd0VOqswXs5McaJHj53zA_jGbokKHXb1wh0Z8XljRTup7NeMZ6MN5_OhwAHZr0CfHFMGJkiNhw4Kh2GOA4_6B0WGQAx0obFfG.QSw0Nxr_jh4rG8lKyhelqh.8cDVY_.VD9DUQWUk.sCr53WMcZ..g83L6suyUBgyRxFSXxgH7gVN5FOSXOpLwHXS9w3PijMOhI33rFOF2_VlyEJVDhzlNFwVR',
  //     domain: '.dexscreener.com',
  //     path: '/',
  //     httpOnly: true,
  //     secure: true,
  //   },
  //   {
  //     name: '__cf_bm',
  //     value:
  //       'hUlbULBwm6HGXnXyqc0HhNpmzd3.Qm8ajSH3QYAjnKM-1747838856-1.0.1.1-I_Z5EnrqqAyClUU07kylMUJvMqqECp9bw1OdA0f8XNS.tOmXKOqpBxb4_E81Hk_GGsOd56VQhjwf6WjAGbC7mLHriD33wOMSRJT6N8zBseIH.4S9p9yR0dkK8X19m2vr',
  //     domain: '.dexscreener.com',
  //     path: '/',
  //     httpOnly: true,
  //     secure: true,
  //   }
  // );


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

  // ─── local parsers ────────────────────────────────────────────────────────────
  const isLowerWord  = (s: string): boolean => /^[a-z]{3,12}$/.test(s);
  const isBase58     = (s: string): boolean => /^[A-Za-z0-9]{40,}$/.test(s);
  const isUpperSymbol= (s: string): boolean => /^[A-Z0-9]{2,10}$/.test(s);
  const isPrice      = (s: string): boolean => /^\d*\.?\d+$/.test(s);
  const looksQuote   = (s: string): boolean => /(wrapped|usd|sol|eth)/i.test(s);

  function splitPair(addr: string): { pool: string; tok1: string } {
    const pool = addr.slice(addr.length - 89, 45); // длина двух адресов ~90
    const tok1 = addr.slice(addr.length - 89 + pool.length + 1);
    return { pool, tok1 };
  }

  function extractTokenPairs(rawStr: string[]): TokenPair[] {
    try {
      const ascii = rawStr;
      const out: TokenPair[] = [];

      for (let i = 0; i < ascii.length - 8; i++) {
        if (!isLowerWord(ascii[i])) continue;
        if (!isLowerWord(ascii[i + 1])) continue;
        if (!isBase58(ascii[i + 2])) continue;

        const { pool, tok1 } = splitPair(ascii[i + 2]);
        const name   = ascii[i + 3].replace(/^"+|"+$/g, '').trim();
        const symbol = ascii[i + 4].replace(/^"+|"+$/g, '').trim();
        if (!isUpperSymbol(symbol)) continue;

        const quoteId = ascii[i + 5].replace(/^V/, '');
        const quoteNm = ascii[i + 6];
        if (!looksQuote(quoteNm)) continue;

        const priceSol = ascii[i + 7];
        const priceUsd = ascii[i + 8];
        if (!isPrice(priceSol) || !isPrice(priceUsd)) continue;

        out.push({
          network   : ascii[i],
          dex       : ascii[i + 1],
          poolAddress: pool,
          token1    : tok1,
          token2    : quoteId,
          name,
          symbol,
          quoteSymbol: quoteNm,
          priceSol,
          priceUsd,
        });

        i += 8;
      }
      return out;
    } catch (e) {
      console.error('extractTokenPairs error:', e);
      return [];
    }
  }

  // ─── expose fn for browser → node ─────────────────────────────────────────────
  await page.exposeFunction('ascii', (data: string[]): void => {
    saveArray('./pairs.json', data);

    const newData = extractTokenPairs(data);
    if (newData?.length) {
      saveArray('./out_pairs.json', newData);
      console.log('newData', newData);
    }
  });

  // ─── browser-side WS sniffer ──────────────────────────────────────────────────
  await page.evaluate(() => {
    const ws = new WebSocket(
      'wss://io.dexscreener.com/dex/screener/v5/pairs/h24/1?rankBy[key]=trendingScoreM5&rankBy[order]=desc&filters[chainIds][0]=solana'
    );

    ws.onerror = async (err) => {
      console.log('WebSocket error:', err);
      await sendMessageToTelegramBot(`Не удалось подключиться к сокетам - ${err}`);
    };
    
    ws.onclose = async (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      await sendMessageToTelegramBot(`Соединение закрыто: ${event.code} ${event.reason || ''}`);
    };

    ws.onmessage = async (msg) => {
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
          const bytes  = new Uint8Array(buffer);
          console.log('📦 Blob / Binary (first 32 bytes):', [
            ...bytes.slice(0, 32),
          ]);
          const hexDump = [...bytes.slice(0, 32)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(' ');
          console.log('🧪 Hex dump:', hexDump);

          // @ts-ignore – функция пришла из exposeFunction
          window.ascii(extractAsciiStrings(bytes));
        }
      } catch (e: any) {
        console.log('e.message', e.message);
        await sendMessageToTelegramBot("Ошибка расшифровки ответа от сокетов", e.message);
      }
    };
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
