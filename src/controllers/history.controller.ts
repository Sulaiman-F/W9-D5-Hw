import { Response } from "express"
import { HistoryService } from "../services/history.service"
import { HistoryValidator } from "../utils/validators"
import { AuthRequest } from "../middleware/auth"
import { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../utils/http-status"

export const getHistory = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const query = req.query

    // Validate query parameters
    const validation = HistoryValidator.validateHistoryQuery(query)
    if (!validation.isValid) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: validation.errors.join(", "),
        },
      })
      return
    }

    // Check if this is a count request
    if (query.count === "true") {
      const filter = {
        userId: String((req.user as any)._id),
        from: query.from ? new Date(query.from as string) : undefined,
        to: query.to ? new Date(query.to as string) : undefined,
        lat: query.lat ? parseFloat(query.lat as string) : undefined,
        lon: query.lon ? parseFloat(query.lon as string) : undefined,
      }

      const result = await HistoryService.getHistoryCount(filter)

      if (!result.success) {
        res.status(INTERNAL_SERVER_ERROR).json({
          success: false,
          error: result.error,
        })
        return
      }

      res.status(OK).json({
        success: true,
        count: result.count,
      })
      return
    }

    // Regular history request
    const historyQuery = {
      skip: parseInt(query.skip as string) || 0,
      limit: parseInt(query.limit as string) || 10,
      sort: (query.sort as string) || "-requestedAt",
      filter: {
        userId: String((req.user as any)._id),
        from: query.from ? new Date(query.from as string) : undefined,
        to: query.to ? new Date(query.to as string) : undefined,
        lat: query.lat ? parseFloat(query.lat as string) : undefined,
        lon: query.lon ? parseFloat(query.lon as string) : undefined,
      },
    }

    const result = await HistoryService.getHistory(historyQuery)

    if (!result.success) {
      res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.error,
      })
      return
    }

    res.status(OK).json({
      success: true,
      data: result.data,
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
