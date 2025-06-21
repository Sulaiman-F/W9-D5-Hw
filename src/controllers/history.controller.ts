import { Response } from "express"
import { History } from "../models/History"
import { Weather } from "../models/Weather"
import { AuthRequest } from "../middleware/auth"
import { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../utils/http-status"

export const getHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      skip = "0",
      limit = "10",
      sort = "-requestedAt",
      from,
      to,
      lat,
      lon,
      count,
    } = req.query
    if (count === "true") {
      const filter: any = { user: req.user!._id }
      if (from || to) {
        filter.requestedAt = {}
        if (from) filter.requestedAt.$gte = new Date(from as string)
        if (to) filter.requestedAt.$lte = new Date(to as string)
      }
      if (lat) filter.lat = parseFloat(lat as string)
      if (lon) filter.lon = parseFloat(lon as string)

      const total = await History.countDocuments(filter)

      res.status(OK).json({
        success: true,
        data: { total },
      })
      return
    }

    const skipNum = parseInt(skip as string) || 0
    const limitNum = Math.min(parseInt(limit as string) || 10, 100) // Max 100 items

    const filter: any = { user: req.user!._id }

    if (from || to) {
      filter.requestedAt = {}
      if (from) {
        filter.requestedAt.$gte = new Date(from as string)
      }
      if (to) {
        filter.requestedAt.$lte = new Date(to as string)
      }
    }

    if (lat) filter.lat = parseFloat(lat as string)
    if (lon) filter.lon = parseFloat(lon as string)

    let sortOption: any = { requestedAt: -1 } // Default sort
    if (sort) {
      const sortStr = sort as string
      if (sortStr.startsWith("-")) {
        const field = sortStr.substring(1)
        sortOption = { [field]: -1 }
      } else {
        sortOption = { [sortStr]: 1 }
      }
    }

    const historyItems = await History.find(filter)
      .sort(sortOption)
      .skip(skipNum)
      .limit(limitNum)
      .populate("weather")
      .lean()

    const formattedHistory = historyItems.map((item: any) => ({
      lat: item.lat,
      lon: item.lon,
      requestedAt: item.requestedAt,
      weather: item.weather
        ? {
            source:
              item.weather.fetchedAt > new Date(Date.now() - 30 * 60 * 1000)
                ? "cache"
                : "historical",
            tempC: item.weather.data?.main?.temp || 0,
            humidity: item.weather.data?.main?.humidity || 0,
            description:
              item.weather.data?.weather?.[0]?.description || "No description",
          }
        : null,
    }))

    res.status(OK).json({
      success: true,
      data: formattedHistory,
    })
  } catch (error: any) {
    console.error("History controller error:", error)

    if (error.name === "CastError") {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "INVALID_PARAMETER",
          message: "Invalid parameter format",
        },
      })
      return
    }

    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch history",
      },
    })
  }
}
