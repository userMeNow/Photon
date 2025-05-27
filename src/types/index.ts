export interface TokenPair {
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
    supply: number;
    liquiditySol: number;
    liquidityToken: number;
    marketCapSol: number;
    prevMarketCapSol: number;
    marketCapPercentChange: number;
    volumeSol: number;
    buyCount: number;
    sellCount: number;
  }