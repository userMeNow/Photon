import { Token, IToken } from '../models/Token';

export async function saveToken(data: Partial<IToken>): Promise<IToken> {
  const token = new Token(data);
  return await token.save();
}

export async function getTokens(limit = 20, offset = 0): Promise<IToken[]> {
  return await Token.find({})
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();
}