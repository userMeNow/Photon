import {TokenPair} from "../types";

export const isLowerWord = (s: string): boolean => /^[a-z]{3,12}$/.test(s);
export const isBase58 = (s: string): boolean => /^[A-Za-z0-9]{40,}$/.test(s);
export const isUpperSymbol = (s: string): boolean => /^[A-Z0-9]{2,10}$/.test(s);
export const isPrice = (s: string): boolean => /^\d*\.?\d+$/.test(s);
export const looksQuote = (s: string): boolean => /(wrapped|usd|sol|eth)/i.test(s);

export function splitPair(addr: string): { pool: string; tok1: string } {
  const pool = addr.slice(addr.length - 89, 45); // длина двух адресов ~90
  const tok1 = addr.slice(addr.length - 89 + pool.length + 1);
  return { pool, tok1 };
}

export function extractTokenPairs(rawStr: string[]): TokenPair[] {
  try {
    const ascii = rawStr;
    const out: TokenPair[] = [];

    for (let i = 0; i < ascii.length - 8; i++) {
      if (!isLowerWord(ascii[i])) continue;
      if (!isLowerWord(ascii[i + 1])) continue;
      if (!isBase58(ascii[i + 2])) continue;

      const { pool, tok1 } = splitPair(ascii[i + 2]);
      const name = ascii[i + 3].replace(/^"+|"+$/g, '').trim();
      const symbol = ascii[i + 4].replace(/^"+|"+$/g, '').trim();
      if (!isUpperSymbol(symbol)) continue;

      const quoteId = ascii[i + 5].replace(/^V/, '');
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