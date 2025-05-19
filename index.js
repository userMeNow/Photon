import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import WebSocket from 'ws'
import msgpack from '@msgpack/msgpack'
//import schema from './DexMessage.json' assert { type: 'json' };
import avro from 'avsc';

const schema = {
  "type": "record",
  "name": "DexMessage",
  "namespace": "com.ds",
  "fields": [
    {
      "name": "schemaVersion",
      "type": "string",
      "default": ""
    },
    {
      "name": "type",
      "type": {
        "type": "enum",
        "name": "MessageType",
        "symbols": [
          "pairs",
          "latestBlock"
        ]
      },
      "default": "pairs"
    },
    {
      "name": "stats",
      "type": [
        "null",
        {
          "type": "record",
          "name": "GlobalStats",
          "fields": [
            {
              "name": "m5",
              "type": {
                "type": "record",
                "name": "WindowStats_m5",
                "fields": [
                  {
                    "name": "txns",
                    "type": [
                      "null",
                      "long"
                    ],
                    "default": null
                  },
                  {
                    "name": "volumeUsd",
                    "type": [
                      "null",
                      "double"
                    ],
                    "default": null
                  }
                ]
              }
            },
            {
              "name": "h1",
              "type": "WindowStats_m5"
            },
            {
              "name": "h6",
              "type": "WindowStats_m5"
            },
            {
              "name": "h24",
              "type": "WindowStats_m5"
            }
          ]
        }
      ],
      "default": null
    },
    {
      "name": "pairs",
      "type": [
        "null",
        {
          "type": "array",
          "items": {
            "type": "record",
            "name": "Pair",
            "fields": [
              {
                "name": "chainId",
                "type": "int",
                "default": 0
              },
              {
                "name": "dexId",
                "type": "string",
                "default": ""
              },
              {
                "name": "labels",
                "type": [
                  "null",
                  {
                    "type": "array",
                    "items": "string"
                  }
                ],
                "default": null
              },
              {
                "name": "pairAddress",
                "type": "string",
                "default": ""
              },
              {
                "name": "baseToken",
                "type": {
                  "type": "record",
                  "name": "Token",
                  "fields": [
                    {
                      "name": "address",
                      "type": "string",
                      "default": ""
                    },
                    {
                      "name": "name",
                      "type": "string",
                      "default": ""
                    },
                    {
                      "name": "symbol",
                      "type": "string",
                      "default": ""
                    },
                    {
                      "name": "decimals",
                      "type": [
                        "null",
                        "int"
                      ],
                      "default": null
                    },
                    {
                      "name": "totalSupply",
                      "type": [
                        "null",
                        "double"
                      ],
                      "default": null
                    }
                  ]
                }
              },
              {
                "name": "quoteToken",
                "type": "Token"
              },
              {
                "name": "quoteTokenSymbol",
                "type": "string",
                "default": ""
              },
              {
                "name": "price",
                "type": "double",
                "default": 0.0
              },
              {
                "name": "priceUsd",
                "type": [
                  "null",
                  "double"
                ],
                "default": null
              },
              {
                "name": "txns",
                "type": {
                  "type": "record",
                  "name": "TxnsWindow",
                  "fields": [
                    {
                      "name": "m5",
                      "type": {
                        "type": "record",
                        "name": "BuysSells",
                        "fields": [
                          {
                            "name": "buys",
                            "type": [
                              "null",
                              "long"
                            ],
                            "default": null
                          },
                          {
                            "name": "sells",
                            "type": [
                              "null",
                              "long"
                            ],
                            "default": null
                          }
                        ]
                      }
                    },
                    {
                      "name": "h1",
                      "type": "BuysSells"
                    },
                    {
                      "name": "h6",
                      "type": "BuysSells"
                    },
                    {
                      "name": "h24",
                      "type": "BuysSells"
                    }
                  ]
                }
              },
              {
                "name": "buyers",
                "type": [
                  "null",
                  "TxnsWindow"
                ],
                "default": null
              },
              {
                "name": "sellers",
                "type": [
                  "null",
                  "TxnsWindow"
                ],
                "default": null
              },
              {
                "name": "makers",
                "type": [
                  "null",
                  "TxnsWindow"
                ],
                "default": null
              },
              {
                "name": "volume",
                "type": "WindowStats_m5"
              },
              {
                "name": "volumeBuy",
                "type": "WindowStats_m5"
              },
              {
                "name": "volumeSell",
                "type": "WindowStats_m5"
              },
              {
                "name": "priceChange",
                "type": "WindowStats_m5"
              },
              {
                "name": "liquidity",
                "type": {
                  "type": "record",
                  "name": "Liquidity",
                  "fields": [
                    {
                      "name": "usd",
                      "type": [
                        "null",
                        "double"
                      ],
                      "default": null
                    },
                    {
                      "name": "base",
                      "type": [
                        "null",
                        "double"
                      ],
                      "default": null
                    },
                    {
                      "name": "quote",
                      "type": [
                        "null",
                        "double"
                      ],
                      "default": null
                    }
                  ]
                }
              },
              {
                "name": "marketCap",
                "type": [
                  "null",
                  "double"
                ],
                "default": null
              },
              {
                "name": "fdv",
                "type": [
                  "null",
                  "double"
                ],
                "default": null
              },
              {
                "name": "pairCreatedAt",
                "type": [
                  "null",
                  "long"
                ],
                "default": null
              },
              {
                "name": "profile",
                "type": [
                  "null",
                  {
                    "type": "record",
                    "name": "Profile",
                    "fields": [
                      {
                        "name": "eti",
                        "type": [
                          "null",
                          "boolean"
                        ],
                        "default": null
                      },
                      {
                        "name": "header",
                        "type": [
                          "null",
                          "boolean"
                        ],
                        "default": null
                      },
                      {
                        "name": "website",
                        "type": [
                          "null",
                          "string"
                        ],
                        "default": null
                      },
                      {
                        "name": "twitter",
                        "type": [
                          "null",
                          "boolean"
                        ],
                        "default": null
                      },
                      {
                        "name": "discord",
                        "type": [
                          "null",
                          "string"
                        ],
                        "default": null
                      },
                      {
                        "name": "linkCount",
                        "type": [
                          "null",
                          "int"
                        ],
                        "default": null
                      },
                      {
                        "name": "imgKey",
                        "type": [
                          "null",
                          "string"
                        ],
                        "default": null
                      },
                      {
                        "name": "nsfw",
                        "type": [
                          "null",
                          "boolean"
                        ],
                        "default": null
                      }
                    ]
                  }
                ],
                "default": null
              },
              {
                "name": "isBoostable",
                "type": [
                  "null",
                  "boolean"
                ],
                "default": null
              },
              {
                "name": "c",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "cmsProfile",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "boosts",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "cgi",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "moonshot",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "launchpad",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              },
              {
                "name": "pn",
                "type": [
                  "null",
                  "string"
                ],
                "default": null
              }
            ]
          }
        }
      ],
      "default": null
    },
    {
      "name": "pairsCount",
      "type": [
        "null",
        "long"
      ],
      "default": null
    },
    {
      "name": "latestBlock",
      "type": [
        "null",
        {
          "type": "record",
          "name": "LatestBlock",
          "fields": [
            {
              "name": "blockNumber",
              "type": "long",
              "default": 0
            },
            {
              "name": "blockTimestamp",
              "type": "long",
              "default": 0
            }
          ]
        }
      ],
      "default": null
    }
  ]
}


puppeteer.use(StealthPlugin())

const wsClients = new Set()
export const DexType = avro.Type.forSchema(schema);
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
      value: 'KEUknlkB.5avfqqwm8hlvDZOy66KGr6ZqPvJ9WvVM6Y-1747653868-1.2.1.1-7CSkjlsDj6v.yl2B.QxNKnC7Yk8iidF2_8EvMrfNOxgZtxH7.0DawGbth6JaAd.2_suAPKjBhFUjFdyXnm_zwqvFGcg1f15GuRUhRp6Ab4D1Td4H8CqDLl4sBqkj_l1Vv.YfbJ5oByOjjvbebLIoo0Qyk5OH9nG8tyyn7dvG_Psi6Q3MFdHbFavVhE3AjJpBshAfif3uL.RiTPl36ZU9oSm69aukBJnu1tZwMcg3BACefkgPo0nxd7mXAXBoNQgsqXUB.3H3_vQWvA_sYYrcx1RetSCHLSBiv.HROvWAHibFLIoeK1luWkxz_4UcWsXvkImaQ0gKd43d_H_wG3_n0LmnbRk18LAmXGDF7v9LiIZ7Bq0kuSGPYRgF6b1HVVof',
      domain: '.dexscreener.com',
      path: '/',
      httpOnly: true,
      secure: true
    },
    {
      name: '__cf_bm',
      value: 'C9hSoR7K_JwW6RL63ZHUiJ.7LPhVurBGAYc.3j34eV4-1747654166-1.0.1.1-KT8fiWrz5.G2eetpnHpwplSL.MsJ9OQWsurgUT5efjWBQqyap0.Ic.dzGS5j.EQZYCmb_BhQdzJRxjN8LfnaVEkPejo7kfrOm4xkDgPgcliOmDoPN.g5TvO_QoOD4PkM',
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

  // await page.waitForFunction(() => {
  //   return Array.from(window.performance.getEntriesByType('resource'))
  //     .some(r => r.name.includes('wss://io.dexscreener.com/ws'))
  // }, { timeout: 25000 })

  await page.evaluate(() => {
    const ws = new WebSocket('wss://io.dexscreener.com/dex/screener/v5/pairs/h24/1?rankBy[key]=trendingScoreM5&rankBy[order]=desc&filters[chainIds][0]=solana')

    ws.onmessage = async (msg) => {
      try {
        if (typeof msg.data === 'string') {
          console.log('[ERROR] got string instead of binary');
          return;
        }

        const buf = await msg.data.arrayBuffer();
        const uint8 = [...new Uint8Array(buf)];
        window.sendDexBuffer(uint8, msg);
      } catch (e) {
        console.log('[ERROR]', e?.message || 'unknown');
      }

      return;

      const parseDexData = async (bytes) => {
        console.log("Start parsing")

        // вспомогательная функция из прошлого:
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

        const ascii = extractAsciiStrings(bytes);

        console.log("ascii", ...ascii)

        return []
      }

      const data = msg.data
      //console.log("data", data)

      try {
        const buf = new Uint8Array(await msg.data.arrayBuffer());
        const pkt = DexType.fromBuffer(buf);
        console.log("pkt", pkt);          // полноценный объект
      } catch (e) {
        debugger;
        console.log("e", e.message)
      }


      // console.log("msgData", data)
      // if (data instanceof Blob) {
      //   const buffer = await data.arrayBuffer();
      //   const bytes = new Uint8Array(buffer);
      //   console.log("📦 Blob / Binary (first 32 bytes):", [...bytes.slice(0, 32)]);
      //   const bytesNew = [...bytes.slice(0, 32)].map(b => b.toString(16).padStart(2, '0')).join(" ")
      //   console.log("🧪 Hex dump:", bytesNew);
      //   const parsed = await parseDexData(bytes);
      //   console.log("parsed", parsed)
      // } else if (data instanceof ArrayBuffer) {
      //   const bytes = new Uint8Array(data);
      //   console.log("📦 ArrayBuffer (first 32 bytes):", [...bytes.slice(0, 32)]);
      // } else if (typeof data === "string") {
      //   console.log("📨 Text message:", data);
      //   try {
      //     const parsed = JSON.parse(data);
      //     console.log("🧩 Parsed JSON:", parsed);
      //   } catch {
      //     console.log("❌ Not JSON");
      //   }
      // } else {
      //   console.warn("🤷 Неизвестный тип данных:", typeof data, data);
      // }

      // let t = [];
      // for (let n = 0; n < e.length; n += 11) {
      //   const i = e.slice(n, n + 11)
      //     , o = j.indexOf(i.length)
      //     , s = r.base58.decode(i);
      //   for (let e = 0; e < s.length - o; e++)
      //     if (0 !== s[e])
      //       throw new Error("base58xmr: wrong padding");
      //   t = t.concat(Array.from(s.slice(s.length - o)))
      // }
      // console.log("Uint8Array.from(t)", Uint8Array.from(t))

      window.dispatchEvent(new CustomEvent('DexData', { detail: msg.data }))
    }
  })

  await page.exposeFunction('sendDexBuffer', (arr, msg) => {
    try {
      if (!DexType || typeof DexType.fromBuffer !== 'function') {
        console.log('❌ DexType is broken:', DexType);
        throw new Error('DexType.fromBuffer is not a function');
      }
      
      const buf = Uint8Array.from(arr); // 💡 вот здесь фикс
      const pkt = DexType.fromBuffer(buf);
      console.log("✅ pkt", pkt);
    } catch (e) {
      console.error("🔥 Decode error:", e.message);
    }
  });

  await page.exposeFunction('onDexData', data => {
    for (const client of wsClients) {
      client.send(data)
    }
  })

  await page.evaluate(() => {
    window.addEventListener('DexData', event => {
      window.onDexData(event.detail)
    })
  })
}

const wss = new WebSocket.Server({ port: 6969 })
wss.on('connection', (ws) => {
  wsClients.add(ws)
  ws.on('close', () => wsClients.delete(ws))
})

start()

