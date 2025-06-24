import { Response } from "express"
import { WeatherService } from "../services/weather.service"
import { WeatherValidator } from "../utils/validators"
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

    // Validate coordinates
    const validation = WeatherValidator.validateCoordinates(
      lat as string,
      lon as string
    )
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

    const latitude = parseFloat(lat as string)
    const longitude = parseFloat(lon as string)

    // Call weather service
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
