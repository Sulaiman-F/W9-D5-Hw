import { Response } from "express"
import { WeatherService } from "../services/weather.service"
import { AuthRequest } from "../middleware/auth"
import {
  OK,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  SERVICE_UNAVAILABLE,
} from "../utils/http-status"

export const getCurrentWeather = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { lat, lon } = req.query
    if (!lat || !lon) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "MISSING_COORDINATES",
          message: "Latitude and longitude are required",
        },
      })
      return
    }
    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lon as string)

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "INVALID_COORDINATES",
          message: "Invalid latitude or longitude format",
        },
      })
      return
    }
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "COORDINATES_OUT_OF_RANGE",
          message:
            "Latitude must be between -90 and 90, longitude between -180 and 180",
        },
      })
      return
    }
    const weatherData = await WeatherService.getCurrentWeather(
      req.user!,
      latitude,
      longitude
    )

    res.status(OK).json({
      success: true,
      data: weatherData,
    })
  } catch (error: any) {
    console.error("Weather controller error:", error)

    if (error.message?.includes("temporarily unavailable")) {
      res.status(SERVICE_UNAVAILABLE).json({
        success: false,
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Weather service temporarily unavailable",
        },
      })
      return
    }

    if (error.message?.includes("API key")) {
      res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: "CONFIGURATION_ERROR",
          message: "Weather service configuration error",
        },
      })
      return
    }

    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch weather data",
      },
    })
  }
}
