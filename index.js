import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import WebSocket from 'ws'
import fs from 'fs';
import path from 'path';

export function saveArray(filePath, arr, append = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const json = JSON.stringify(arr, null, 2);

  append
    ? fs.appendFileSync(filePath, json + '\n')   
    : fs.writeFileSync(filePath, json);          
  console.log(`💾  saved ${Array.isArray(arr) ? arr.length + ' items' : ''} -> ${filePath}`);
}

puppeteer.use(StealthPlugin())

const wsClients = new Set()
const start = async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    //executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  })

  const page = await browser.newPage()

  page.on('console', msg => console.log('[PAGE]', msg.text()))

  await page.setCookie(
    {
      name: 'cf_clearance',
      value: 'prf5PlF9pkX2E3IzpRkhziqr3e3Eo4ayZ._IT4_vMrw-1747825365-1.2.1.1-tI9ak4oYH0OkaUdygSIq3borJvp6XQn1TnmBZkXfbJDMPr2PxmzeGhzA7CYYyqbh4Yn6TeF1LnioPEp920IhpRDwRNJopyh302tHM6yuMRSr.F4GRsuk6ktNtnYE4lQpaDTIrdz494xOVjfPblN1LDbuYVBG00EuSQvusCFCLAWW86tVi7375erW2akZ4i_uPqe9A7VIzUCFXYMPPf3R9h2EGVFJWwgWPBCG5KzM02kxqjZYAbmU6X13uSedSisXaFSYcf2HbA040y6arpA4L9mQTj9J3t_IoMqElCcV1DfrKGPtiYrwLegYK1tLYa9.e.C2MBhCzoIfiezqujwYmKG8C6LXw9MvbrLyVqsvBSgtNR.5JSX.78nSjUI1V1rk',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true
    },
    {
      name: '__cf_bm',
      value: '5bPATqvmJnimSFcCOkK8OQj23BP13KLTLcHfs9FoJW8-1747825364-1.0.1.1-4GwkffCVRzbHQ7NNjjFTP2_goio7iAOd.cKxrRfx0f9ncxSuavTuDN9MZfTSQVUDA1ykQzjJXbiD5EB74mnM9zt7qSFazTWov56MG9Nh4hAUYkqI54rTdt6VM3v1deft',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true
    }
  )


  await page.goto('https://dexscreener.com', {
    waitUntil: 'networkidle2',
    timeout: 0
  })


  const isLowerWord = s => /^[a-z]{3,12}$/.test(s);
  const isBase58 = s => /^[A-Za-z0-9]{40,}$/.test(s);
  const isUpperSymbol = s => /^[A-Z0-9]{2,10}$/.test(s);
  const isPrice = s => /^\d*\.?\d+$/.test(s);
  const looksQuote = s => /(wrapped|usd|sol|eth)/i.test(s);

  function splitPair(addr) {
    let pool = addr.slice(addr.length-89, 45);//длина двух адресов - 90 символов, между смартами один разделительный символ
    let tok1 = addr.slice(addr.length-89 + pool.length + 1);
    return { pool, tok1 };
  }

  function extractTokenPairs(rawStr) {
    try {
      const ascii = rawStr;
      const out = [];

      for (let i = 0; i < ascii.length - 8; i++) {
        if (!isLowerWord(ascii[i])) continue;           
        if (!isLowerWord(ascii[i + 1])) continue;       
        if (!isBase58(ascii[i + 2])) continue;          

        const { pool, tok1 } = splitPair(ascii[i + 2]);
        const name = ascii[i + 3].replace(/^"+|"+$/g, '').trim();   // убираем кавычки
        const symbol = ascii[i + 4].replace(/^"+|"+$/g, '').trim();
        if (!isUpperSymbol(symbol)) continue;

        const quoteId = ascii[i + 5].replace(/^V/, ''); // VSo111… → So111…
        const quoteNm = ascii[i + 6];
        if (!looksQuote(quoteNm)) continue;

        const priceSol = ascii[i + 7];
        const priceUsd = ascii[i + 8];
        if (!isPrice(priceSol) || !isPrice(priceUsd)) continue;

        out.push({
          network: ascii[i],
          dex: ascii[i + 1],
          poolAddress: pool,
          token1: tok1,
          token2: quoteId,
          name,
          symbol,
          quoteSymbol: quoteNm,
          priceSol: priceSol,
          priceUsd: priceUsd
        });

        i += 8; 
      }

      return out;
    }
    catch (e) {
      console.log("e", e)
    }
  }


  await page.exposeFunction('ascii', (data) => {
    console.log("data", data)
    saveArray('./pairs.json', data);

    let newData = extractTokenPairs(data);
    if (newData?.length) {
      saveArray('./out_pairs.json', newData);
      console.log("newData", newData)
    }
  })

  await page.evaluate(() => {
    const ws = new WebSocket('wss://io.dexscreener.com/dex/screener/v5/pairs/h24/1?rankBy[key]=trendingScoreM5&rankBy[order]=desc&filters[chainIds][0]=solana');
    ws.onmessage = async (msg) => {
      try {
        function extractAsciiStrings(bytes, minLength = 4) {
          let str = "", results = [];
          for (let b of bytes) {
            if (b >= 32 && b <= 126) {
              str += String.fromCharCode(b);
            } else {
              if (str.length >= minLength) results.push(str);
              str = "";
            }
          }
          if (str.length >= minLength) results.push(str);
          return results;
        }

        const dataMsg = msg.data
        if (dataMsg instanceof Blob) {
          const buffer = await dataMsg.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          console.log("📦 Blob / Binary (first 32 bytes):", [...bytes.slice(0, 32)]);
          const bytesNew = [...bytes.slice(0, 32)].map(b => b.toString(16).padStart(2, '0')).join(" ")
          console.log("🧪 Hex dump:", bytesNew);
          window.ascii(extractAsciiStrings(bytes));
        }
      }
      catch (e) {
        console.log("e.message", e.message)
      }
    };
  });
}

const wss = new WebSocket.Server({ port: 6969 })
wss.on('connection', (ws) => {
  wsClients.add(ws)
  ws.on('close', () => wsClients.delete(ws))
})

start()

