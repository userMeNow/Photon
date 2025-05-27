import mongoose, { Document, Schema } from 'mongoose';

export interface IToken extends Document {
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
  createdAt?: Date;
  updatedAt?: Date;
}


const TokenSchema = new Schema<IToken>(
  {
    network: String,
    dex: String,
    poolAddress: String,
    token1: String,
    token2: String,
    name: String,
    symbol: String,
    quoteSymbol: String,
    priceSol: String,
    priceUsd: String,
    supply: Number,
    liquiditySol: Number,
    liquidityToken: Number,
    marketCapSol: Number,
    prevMarketCapSol: Number,
    marketCapPercentChange: Number,
    volumeSol: Number,
    buyCount: Number,
    sellCount: Number
  },
  { timestamps: true }
);


export const Token = mongoose.model<IToken>('Token', TokenSchema);
