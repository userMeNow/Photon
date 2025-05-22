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
    priceUsd: String
  },
  { timestamps: true }
);

export const Token = mongoose.model<IToken>('Token', TokenSchema);
