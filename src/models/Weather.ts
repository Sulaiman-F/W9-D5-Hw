import mongoose, { Document, Schema } from "mongoose"

export interface IWeather extends Document {
  lat: number
  lon: number
  data: any
  fetchedAt: Date
}

const weatherSchema = new Schema<IWeather>({
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
})

// Create compound unique index for lat and lon
weatherSchema.index({ lat: 1, lon: 1 }, { unique: true })

// Create TTL index for automatic cleanup of old cached data
weatherSchema.index({ fetchedAt: 1 }, { expireAfterSeconds: 7200 }) // 2 hours

export const Weather = mongoose.model<IWeather>("Weather", weatherSchema)
