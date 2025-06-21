import axios from "axios"
import { Weather } from "../models/Weather"
import { History } from "../models/History"
import { IUser } from "../models/User"

interface WeatherResponse {
  source: "cache" | "openweather"
  coordinates: { lat: number; lon: number }
  tempC: number
  humidity: number
  description: string
  fetchedAt: string
}

export class WeatherService {
  private static roundCoordinates(
    lat: number,
    lon: number
  ): { lat: number; lon: number } {
    return {
      lat: Math.round(lat * 100) / 100,
      lon: Math.round(lon * 100) / 100,
    }
  }

  private static async checkCache(
    lat: number,
    lon: number
  ): Promise<any | null> {
    const cacheMinutes = parseInt(process.env.WEATHER_CACHE_MINUTES || "30")
    const cacheExpiry = new Date(Date.now() - cacheMinutes * 60 * 1000)

    try {
      const cached = await Weather.findOne({
        lat,
        lon,
        fetchedAt: { $gte: cacheExpiry },
      })

      return cached
    } catch (error) {
      console.error("Cache check error:", error)
      return null
    }
  }

  private static async fetchFromOpenWeather(
    lat: number,
    lon: number
  ): Promise<any> {
    const apiKey = process.env.OPENWEATHER_API_KEY
    const baseUrl =
      process.env.OPENWEATHER_BASE_URL ||
      "https://api.openweathermap.org/data/2.5"

    if (!apiKey) {
      throw new Error("OpenWeather API key not configured")
    }

    const url = `${baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`

    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 503) {
          throw new Error("Weather service temporarily unavailable")
        }
        throw new Error(
          `Weather API error: ${error.response?.data?.message || error.message}`
        )
      }
      throw error
    }
  }

  private static async saveToCache(
    lat: number,
    lon: number,
    data: any
  ): Promise<any> {
    try {
      const weather = await Weather.findOneAndUpdate(
        { lat, lon },
        { lat, lon, data, fetchedAt: new Date() },
        { upsert: true, new: true }
      )
      return weather
    } catch (error) {
      console.error("Cache save error:", error)
      throw error
    }
  }

  private static formatWeatherResponse(
    weatherData: any,
    source: "cache" | "openweather"
  ): WeatherResponse {
    const data = weatherData.data || weatherData

    return {
      source,
      coordinates: {
        lat: data.coord?.lat || weatherData.lat,
        lon: data.coord?.lon || weatherData.lon,
      },
      tempC: data.main?.temp || 0,
      humidity: data.main?.humidity || 0,
      description: data.weather?.[0]?.description || "No description",
      fetchedAt: weatherData.fetchedAt || new Date().toISOString(),
    }
  }

  private static async logToHistory(
    user: IUser,
    weather: any,
    lat: number,
    lon: number
  ): Promise<void> {
    try {
      const history = new History({
        user: user._id,
        weather: weather._id,
        lat,
        lon,
        requestedAt: new Date(),
      })
      await history.save()
    } catch (error) {
      console.error("History logging error:", error)
    }
  }

  public static async getCurrentWeather(
    user: IUser,
    lat: number,
    lon: number
  ): Promise<WeatherResponse> {
    const roundedCoords = this.roundCoordinates(lat, lon)
    const cached = await this.checkCache(roundedCoords.lat, roundedCoords.lon)

    if (cached) {
      await this.logToHistory(
        user,
        cached,
        roundedCoords.lat,
        roundedCoords.lon
      )
      return this.formatWeatherResponse(cached, "cache")
    }
    const freshData = await this.fetchFromOpenWeather(
      roundedCoords.lat,
      roundedCoords.lon
    )
    const savedWeather = await this.saveToCache(
      roundedCoords.lat,
      roundedCoords.lon,
      freshData
    )
    await this.logToHistory(
      user,
      savedWeather,
      roundedCoords.lat,
      roundedCoords.lon
    )

    return this.formatWeatherResponse(savedWeather, "openweather")
  }
}
