import { History } from "../models/History"
import { Weather } from "../models/Weather"

export interface HistoryFilter {
  userId: string
  from?: Date
  to?: Date
  lat?: number
  lon?: number
}

export interface HistoryQuery {
  skip?: number
  limit?: number
  sort?: string
  filter: HistoryFilter
}

export interface HistoryResult {
  success: boolean
  data?: any[]
  count?: number
  error?: {
    code: string
    message: string
  }
}

export class HistoryService {
  static async getHistoryCount(filter: HistoryFilter): Promise<HistoryResult> {
    try {
      const mongoFilter: any = { user: filter.userId }

      if (filter.from || filter.to) {
        mongoFilter.requestedAt = {}
        if (filter.from) mongoFilter.requestedAt.$gte = filter.from
        if (filter.to) mongoFilter.requestedAt.$lte = filter.to
      }

      if (filter.lat) mongoFilter.lat = filter.lat
      if (filter.lon) mongoFilter.lon = filter.lon

      const total = await History.countDocuments(mongoFilter)

      return {
        success: true,
        count: total,
      }
    } catch (error) {
      console.error("History count service error:", error)
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to count history items",
        },
      }
    }
  }

  static async getHistory(query: HistoryQuery): Promise<HistoryResult> {
    try {
      const { skip = 0, limit = 10, sort = "-requestedAt", filter } = query

      const mongoFilter: any = { user: filter.userId }

      if (filter.from || filter.to) {
        mongoFilter.requestedAt = {}
        if (filter.from) mongoFilter.requestedAt.$gte = filter.from
        if (filter.to) mongoFilter.requestedAt.$lte = filter.to
      }

      if (filter.lat) mongoFilter.lat = filter.lat
      if (filter.lon) mongoFilter.lon = filter.lon

      // Parse sort option
      let sortOption: any = { requestedAt: -1 } // Default sort
      if (sort) {
        if (sort.startsWith("-")) {
          const field = sort.substring(1)
          sortOption = { [field]: -1 }
        } else {
          sortOption = { [sort]: 1 }
        }
      }

      const historyItems = await History.find(mongoFilter)
        .sort(sortOption)
        .skip(skip)
        .limit(Math.min(limit, 100)) // Max 100 items
        .populate("weather")
        .lean()

      const formattedHistory = historyItems.map((item: any) => ({
        _id: item._id,
        coordinates: {
          lat: item.lat,
          lon: item.lon,
        },
        fetchedAt: item.requestedAt,
        tempC: item.weather?.data?.main?.temp || 0,
        humidity: item.weather?.data?.main?.humidity || 0,
        description:
          item.weather?.data?.weather?.[0]?.description || "No description",
        source:
          item.weather?.fetchedAt > new Date(Date.now() - 30 * 60 * 1000)
            ? "cache"
            : "historical",
      }))

      return {
        success: true,
        data: formattedHistory,
      }
    } catch (error) {
      console.error("History service error:", error)
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch history",
        },
      }
    }
  }
}
