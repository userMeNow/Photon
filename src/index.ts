import dotenv from 'dotenv';
dotenv.config();
import { validateEnv } from "./utils/env";

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
    headless: false,
    userDataDir: './chrome-profile',
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });


  const pageAxiom = await browser.newPage();

  pageAxiom.on('console', (msg) => console.log('[PAGE-axiom]', msg.text()));



  await pageAxiom.goto('https://axiom.trade', {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });
  await pageAxiom.evaluate(() => {
    localStorage.setItem('settings', `{"showTx":true,"xlButtons":false,"showVolume":true,"solPresets":{"preset1":{"buy":{"autoFee":false,"slippage":"20","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false},"sell":{"autoFee":false,"slippage":"40","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false}},"preset2":{"buy":{"autoFee":false,"slippage":"20","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false},"sell":{"autoFee":false,"slippage":"40","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false}},"preset3":{"buy":{"autoFee":false,"slippage":"20","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false},"sell":{"autoFee":false,"slippage":"40","maxFeeSol":"0.1","bribeFeeSol":"0.001","customRpcUrl":"","mevProtection":false,"priorityFeeSol":"0.001","enhancedMevProtection":false}}},"isMarketCap":true,"showDexPaid":true,"showHolders":true,"showSnipers":true,"showSocials":true,"tablesIsSol":false,"enabledYield":false,"keyboardMode":false,"pastSearches":[],"primaryColor":"#526FFF","pulseFilters":{"migrated":{"age":{"max":null,"min":null},"txns":{"max":null,"min":null},"bundle":{"max":null,"min":null},"volume":{"max":null,"min":null},"dexPaid":false,"holders":{"max":null,"min":null},"numBuys":{"max":null,"min":null},"snipers":{"max":null,"min":null},"twitter":{"max":null,"min":null},"website":false,"botUsers":{"max":null,"min":null},"insiders":{"max":null,"min":null},"numSells":{"max":null,"min":null},"telegram":false,"liquidity":{"max":null,"min":null},"marketCap":{"max":null,"min":null},"protocols":{"bonk":true,"boop":true,"pump":true,"pumpAmm":false,"raydium":false,"moonshot":false,"launchLab":true,"meteoraAmm":false,"launchACoin":true,"meteoraAmmV2":false,"virtualCurve":true},"devHolding":{"max":null,"min":null},"bondingCurve":{"max":null,"min":null},"top10Holders":{"max":null,"min":null},"mustEndInPump":false,"numMigrations":{"max":null,"min":null},"twitterExists":false,"searchKeywords":[],"excludeKeywords":[],"atLeastOneSocial":false},"newPairs":{"age":{"max":null,"min":null},"txns":{"max":null,"min":null},"bundle":{"max":null,"min":null},"volume":{"max":null,"min":null},"dexPaid":false,"holders":{"max":null,"min":null},"numBuys":{"max":null,"min":null},"snipers":{"max":null,"min":null},"twitter":{"max":null,"min":null},"website":false,"botUsers":{"max":null,"min":null},"insiders":{"max":null,"min":null},"numSells":{"max":null,"min":null},"telegram":false,"liquidity":{"max":null,"min":null},"marketCap":{"max":null,"min":null},"protocols":{"bonk":true,"boop":true,"pump":true,"pumpAmm":false,"raydium":false,"moonshot":false,"launchLab":true,"meteoraAmm":false,"launchACoin":true,"meteoraAmmV2":false,"virtualCurve":true},"devHolding":{"max":null,"min":null},"bondingCurve":{"max":null,"min":null},"top10Holders":{"max":null,"min":null},"mustEndInPump":false,"numMigrations":{"max":null,"min":null},"twitterExists":false,"searchKeywords":[],"excludeKeywords":[],"atLeastOneSocial":false},"finalStretch":{"age":{"max":null,"min":null},"txns":{"max":null,"min":null},"bundle":{"max":null,"min":null},"volume":{"max":null,"min":null},"dexPaid":false,"holders":{"max":null,"min":null},"numBuys":{"max":null,"min":null},"snipers":{"max":null,"min":null},"twitter":{"max":null,"min":null},"website":false,"botUsers":{"max":null,"min":null},"insiders":{"max":null,"min":null},"numSells":{"max":null,"min":null},"telegram":false,"liquidity":{"max":null,"min":null},"marketCap":{"max":null,"min":null},"protocols":{"bonk":true,"boop":true,"pump":true,"pumpAmm":false,"raydium":false,"moonshot":false,"launchLab":true,"meteoraAmm":false,"launchACoin":true,"meteoraAmmV2":false,"virtualCurve":true},"devHolding":{"max":null,"min":null},"bondingCurve":{"max":null,"min":null},"top10Holders":{"max":nul}`);
    localStorage.setItem('authMethod', "google");
    localStorage.setItem('isAuthed', 'true');
    localStorage.setItem('isPulse', 'false');
    localStorage.setItem('isSignupModalOpen', 'false');
    localStorage.setItem('shouldOpenTwitterAlertsOnNewTab', '{"isOpen":false,"view":"modal"}');
    localStorage.setItem('shouldOpenWalletTrackerOnNewTab', '{"isOpen":false,"view":"modal"}');
    localStorage.setItem('userId', 'ad199fe7-65f0-420f-8e5d-9fd9afb1c5a2');
    localStorage.setItem('evmPublicKey', '0x6cc2E575013D8AB12e6ed6a3a43B56F862a10998');
    localStorage.setItem('regionsV4', JSON.stringify({
      name: 'US-C',
      url: 'wss://cluster3.axiom.trade',
      forced: true
    }));
  });
  await sleep(2000);
  pageAxiom.setCookie(
    {
      name: 'auth-refresh-token',
      value:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZyZXNoVG9rZW5JZCI6ImMyZjZjNTdiLTYxMTAtNDM1YS05OWU2LWM5NWJhZmJhMDFmZiIsImlhdCI6MTc0ODA4ODAwNn0.JAyL_2lqbs0F8HxTvMfEmuVeZ32O6EuVt36NJwZyHAw',
      domain: '.axiom.trade',
      path: '/',
      httpOnly: true,
      secure: true,
    }
  )
  await pageAxiom.reload({ waitUntil: 'networkidle0' });
  await sleep(2000);

  await pageAxiom.goto('https://axiom.trade/discover', {
    waitUntil: 'domcontentloaded',
    timeout: 0,
  });

  await pageAxiom.evaluate(() => {
    fetch('https://api6.axiom.trade/meme-trending?timePeriod=24h', {
      method: 'GET',
      credentials: 'include'
    }).then(res => res.json())
      .then(data => console.log("✅ Trends:", data))
      .catch(err => console.error("❌ Error:", err));
  });

  await pageAxiom.evaluate(() => {
    const onOpenHandler = () => () => {
      console.log(`Socket connection was setted`)

      const rooms = [
        '1h-meme-trending',
        'meme-trending-refresh-liquidities',
        'sol_price',
        'btc_price',
        'eth_price',
        'block_hash',
        'jito-bribe-fee',
        'sol-priority-fee',
        'connection_monitor',
        'twitter_active_list',
        'twitter_feed_v2'
      ];

      for (const room of rooms) {
        wsh.send(JSON.stringify({ action: 'join', room }));
        console.log(`📤 Subscribing to room: ${room}`);
      }
    }

    const onMessageHandler = () => async (msg) => {
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
        console.log("dataMsg", dataMsg);
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

          // @ts-ignore – function came from exposeFunction
          console.log("extractAsciiStrings(bytes)", extractAsciiStrings(bytes))
        }
      } catch (e: any) {
        console.log(`e.message`, e.message);
        await sendMessageToTelegramBot(`Error decoding socket response with filter: ${e.message}`);
      }
    }

    const onErrorHandler = () => async (err) => {
      console.log(`WebSocket error:`, err);
      await sendMessageToTelegramBot(`Failed to connect to sockets - ${err}`);
    };

    const onCloseHandler = () => async (event) => {
      console.log(`WebSocket closed:`, event.code, event.reason);
      await sendMessageToTelegramBot(`Соединение закрыто для сокета: ${event.code} ${event.reason || ''}`);
    };

    const wsh = new WebSocket(
      `wss://cluster3.axiom.trade/?`
    );

    wsh.onopen = onOpenHandler();

    wsh.onerror = onErrorHandler();

    wsh.onclose = onCloseHandler()

    wsh.onmessage = onMessageHandler()
  });

  return;
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
    await new Promise(resolve => setTimeout(resolve, ms));
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

          // @ts-ignore – function came from exposeFunction
          window.ascii(extractAsciiStrings(bytes), socketType);
        }
      } catch (e: any) {
        console.log(`e.message, socket type - ${socketType}:`, e.message);
        await sendMessageToTelegramBot(`Error decoding socket response with filter: ${e.message}`);
      }
    }

    const onErrorHandler = (socketType) => async (err) => {
      console.log(`WebSocket error, socket type - ${socketType}:`, err);
      await sendMessageToTelegramBot(`Failed to connect to sockets with filter ${socketType}: ${err}`);
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
    arrayTrendingScore.forEach((score) => {
      const wsh = new WebSocket(
        `wss://io.dexscreener.com/dex/screener/v5/pairs/h24/1?rankBy[key]=trendingScore${score}&rankBy[order]=desc&filters[chainIds][0]=solana`
      );

      wsh.onopen = onOpenHandler(score);

      wsh.onerror = onErrorHandler(score);

      wsh.onclose = onCloseHandler(score)

      wsh.onmessage = onMessageHandler(score)
    })
  });
};

// ─── local WS broadcaster ───────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: 6969 });
wss.on('connection', (ws) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
});

mongoose.connect('mongodb://localhost:27017/tokens')//run mongo
  .then(async () => {
    try {
      console.log('MongoDB connected');
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      await RedisService.getInstance().connect();//run reddis
      await start();//run browser
    } catch (e) {
      console.log(`Error during project startup: ${e.message}`);
    }
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });