export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export class AuthValidator {
  static validateSignup(email: string, password: string): ValidationResult {
    const errors: string[] = []

    // Check required fields
    if (!email) {
      errors.push("Email is required")
    }

    if (!password) {
      errors.push("Password is required")
    }

    // Validate email format
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push("Please enter a valid email address")
    }

    // Validate password strength
    if (password && password.length < 6) {
      errors.push("Password must be at least 6 characters long")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  static validateSignin(email: string, password: string): ValidationResult {
    const errors: string[] = []

    // Check required fields
    if (!email) {
      errors.push("Email is required")
    }

    if (!password) {
      errors.push("Password is required")
    }

    // Basic email format check
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push("Please enter a valid email address")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class WeatherValidator {
  static validateCoordinates(
    lat: string | undefined,
    lon: string | undefined
  ): ValidationResult {
    const errors: string[] = []

    // Check required fields
    if (!lat) {
      errors.push("Latitude is required")
    }

    if (!lon) {
      errors.push("Longitude is required")
    }

    if (lat && lon) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lon)

      // Check if coordinates are valid numbers
      if (isNaN(latitude)) {
        errors.push("Invalid latitude format")
      }

      if (isNaN(longitude)) {
        errors.push("Invalid longitude format")
      }

      // Check coordinate ranges
      if (!isNaN(latitude) && (latitude < -90 || latitude > 90)) {
        errors.push("Latitude must be between -90 and 90")
      }

      if (!isNaN(longitude) && (longitude < -180 || longitude > 180)) {
        errors.push("Longitude must be between -180 and 180")
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export class HistoryValidator {
  static validateHistoryQuery(query: any): ValidationResult {
    const errors: string[] = []

    // Validate skip parameter
    if (query.skip !== undefined) {
      const skip = parseInt(query.skip)
      if (isNaN(skip) || skip < 0) {
        errors.push("Skip must be a non-negative number")
      }
    }

    // Validate limit parameter
    if (query.limit !== undefined) {
      const limit = parseInt(query.limit)
      if (isNaN(limit) || limit < 1 || limit > 100) {
        errors.push("Limit must be between 1 and 100")
      }
    }

    // Validate date parameters
    if (query.from && isNaN(Date.parse(query.from))) {
      errors.push("Invalid 'from' date format")
    }

    if (query.to && isNaN(Date.parse(query.to))) {
      errors.push("Invalid 'to' date format")
    }

    // Validate coordinates
    if (query.lat !== undefined) {
      const lat = parseFloat(query.lat)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.push("Latitude must be between -90 and 90")
      }
    }

    if (query.lon !== undefined) {
      const lon = parseFloat(query.lon)
      if (isNaN(lon) || lon < -180 || lon > 180) {
        errors.push("Longitude must be between -180 and 180")
      }
    }

    // Validate sort parameter
    if (query.sort !== undefined) {
      const validSortFields = [
        "requestedAt",
        "lat",
        "lon",
        "-requestedAt",
        "-lat",
        "-lon",
      ]
      if (!validSortFields.includes(query.sort)) {
        errors.push(
          "Invalid sort field. Allowed: requestedAt, lat, lon (prefix with - for descending)"
        )
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}
