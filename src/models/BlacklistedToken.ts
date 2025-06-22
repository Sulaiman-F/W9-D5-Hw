import { Schema, model, Document } from "mongoose"

export interface IBlacklistedToken extends Document {
  token: string
  userId: string
  blacklistedAt: Date
  expiresAt: Date
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  blacklistedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // MongoDB will automatically remove expired documents
  },
})

export const BlacklistedToken = model<IBlacklistedToken>(
  "BlacklistedToken",
  BlacklistedTokenSchema
)
