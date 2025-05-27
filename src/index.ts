import dotenv from 'dotenv';
dotenv.config();
import { validateEnv } from "./utils/env";

validateEnv()

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const WebSocket = require("ws");
import { sendMessageToTelegramBot } from './telegram';
import { saveArray, sleep } from "./helpers";
import { TokenPair } from "./types";
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
    //executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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

  await pageAxiom.exposeFunction('saveTrends', async (trendsInfo: Record<'5m' | '1h' | '6h' | '24h', TokenPair[]>): Promise<void> => {
    for (const period in trendsInfo) {
      saveArray(`./pairs/out_pairs_${period}.json`, trendsInfo[period]);

      trendsInfo[period].forEach(element => {
        saveToken(element)
      });
      await RedisService.getInstance().publish(trendsInfo[period], period);
    }
  });

  await pageAxiom.evaluate(async () => {
    let trends: any = [];
    let priceData = await (async () => {
      const respPriceData = await fetch("https://axiom.trade/api/coin-prices", {
        method: 'GET',
        credentials: 'include'
      });

      return await respPriceData.json();
    })();

    async function localSleep(duration: number) {
      return await new Promise(resolve => setTimeout(resolve, duration));
    }

    function buildTokenPair(tokenData, priceData): TokenPair {
      const solPriceUsd = parseFloat(priceData?.data?.SOL || '0');
      const supply = tokenData?.supply || 0;
      const marketCapSol = tokenData?.marketCapSol || 0;

      const priceSol = supply > 0 ? marketCapSol / supply : 0;
      const priceUsd = priceSol * solPriceUsd;

      return {
        network: 'solana',
        dex: tokenData.protocol || 'unknown',
        poolAddress: tokenData.pairAddress,
        token1: tokenData.tokenAddress,
        token2: tokenData.protocolDetails?.pairTokenAccount || '',
        name: tokenData.tokenName,
        symbol: tokenData.tokenTicker,
        quoteSymbol: 'SOL',
        supply,
        priceSol: priceSol.toFixed(12),
        priceUsd: priceUsd.toFixed(6),
        liquiditySol: tokenData.liquiditySol,
        liquidityToken: tokenData.liquidityToken,
        marketCapSol: tokenData.marketCapSol,
        prevMarketCapSol: tokenData.prevMarketCapSol,
        marketCapPercentChange: tokenData.marketCapPercentChange,
        volumeSol: tokenData.volumeSol,
        buyCount: tokenData.buyCount,
        sellCount: tokenData.sellCount
      };
    }

    const getTrendsInfo = async () => {
      let trendsInfo: any = {};
      const links = [
        "https://api6.axiom.trade/meme-trending?timePeriod=",
        //"https://api2.axiom.trade/old-trending?timePeriod="
      ]

      const timePeriod = [
        "5m",
        "1h",
        "6h",
        "24h"
      ]

      for (let keyLink = 0; keyLink < links.length; keyLink++) {
        const link = links[keyLink];
        for (let keyPeriod = 0; keyPeriod < timePeriod.length; keyPeriod++) {
          const period = timePeriod[keyPeriod];
          await new Promise(resolve => setTimeout(resolve, 1000 * keyPeriod))

          try {
            const res = await fetch(link + period, {
              method: 'GET',
              credentials: 'include'
            });

            const data = await res.json();

            if (!trendsInfo[period]) {
              trendsInfo[period] = data.map(e => buildTokenPair(e, priceData));
            } else {
              trendsInfo[period] = [...trendsInfo[period], ...data.map(e => buildTokenPair(e, priceData))];
            }
            console.log("✅ trendsInfo[" + period + "period]:", trendsInfo[period]);
          } catch (err) {
            console.error("❌ Error:", err);
            await sendMessageToTelegramBot(`Error happened in time parsing of data: ${err.message}`);
          }
        }
      }

      return trendsInfo
    }

    trends = await getTrendsInfo();


    const socketSubscribeForAxiom = () => {
      const onOpenHandler = () => async () => {
        console.log(`Socket connection was setted`)
        const rooms = [
          'meme-trending-refresh-liquidities',
          'sol_price',
        ];

        for (const room of rooms) {
          wsh.send(JSON.stringify({ action: 'join', room }));
          console.log(`Subscribing to room: ${room}`);
        }

        while (true) {
          if (wsh.readyState === WebSocket.OPEN) {
            wsh.send(JSON.stringify({ method: "ping" }));
            console.log(`Sending ping`);
          } else{
            break;
          }
          await localSleep(30*1000);
        }
      }

      const onMessageHandler = () => async (msg) => {
        try {
          const dataMsg = JSON.parse(msg.data);
          console.log("dataMsg", dataMsg);
          if (dataMsg.room === "meme-trending-refresh-liquidities") {
            console.log("trends before", trends)
            for (const period in trends) {
              if (Array.isArray(trends[period])) {
                trends[period] = trends[period].map(trend => {
                  const matchingLiqToken = dataMsg.content.find(liqToken => liqToken.pairAddress === trend.poolAddress);
                  return matchingLiqToken ? { ...trend, ...matchingLiqToken } : trend;
                });
              }
            }
            console.log("trends after", trends)
            window.saveTrends(trends);
          } else if (dataMsg.room === "sol_price") {
            console.log("[sol_price]trends before", trends)
            for (const period in trends) {
              if (Array.isArray(trends[period])) {
                trends[period] = trends[period].map(trend => {
                  const priceSol = trend.supply > 0 ? trend.marketCapSol / trend.supply : 0;
                  const priceUsd = priceSol * dataMsg.content;

                  return ({
                    ...trend,
                    priceSol: priceSol.toFixed(12),
                    priceUsd: priceUsd.toFixed(6),
                  })
                });
              }
            }
            console.log("[sol_price]trends after", trends)
            window.saveTrends(trends);
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
        await sendMessageToTelegramBot(`Connection for socket was closed: ${event.code} ${event.reason || ''}`);
      };

      const wsh = new WebSocket(
        `wss://cluster3.axiom.trade/?`
      );

      wsh.onopen = onOpenHandler();

      wsh.onerror = onErrorHandler();

      wsh.onclose = onCloseHandler()

      wsh.onmessage = onMessageHandler()
    }

    socketSubscribeForAxiom();

    while(true){
      trends = await getTrendsInfo();
      await localSleep(5*60*1000);
    }
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