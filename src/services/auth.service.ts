import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import { BlacklistedToken } from "../models/BlacklistedToken"

const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production-12345"

export interface SignupData {
  email: string
  password: string
}

export interface SigninData {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  token?: string
  error?: {
    code: string
    message: string
  }
}

export class AuthService {
  static async signup(data: SignupData): Promise<AuthResult> {
    try {
      const { email, password } = data

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return {
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists",
          },
        }
      }

      // Hash password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create user
      const user = new User({
        email,
        passwordHash,
        role: "user",
      })

      await user.save()

      // Generate JWT token
      const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
        expiresIn: "1d",
      })

      return {
        success: true,
        token,
      }
    } catch (error) {
      console.error("Signup service error:", error)
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create user",
        },
      }
    }
  }

  static async signin(data: SigninData): Promise<AuthResult> {
    try {
      const { email, password } = data

      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        }
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
      if (!isPasswordValid) {
        return {
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        }
      }

      // Generate JWT token
      const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
        expiresIn: "1d",
      })

      return {
        success: true,
        token,
      }
    } catch (error) {
      console.error("Signin service error:", error)
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to sign in",
        },
      }
    }
  }

  static async signout(token: string, userId: string): Promise<AuthResult> {
    try {
      if (token && userId) {
        // Decode the token to get expiration time
        const decoded = jwt.decode(token) as any
        const expiresAt = new Date(decoded.exp * 1000) // Convert Unix timestamp to Date

        // Add token to blacklist
        await BlacklistedToken.create({
          token,
          userId,
          expiresAt,
        })

        console.log("Token blacklisted successfully for user:", userId)
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error("Signout service error:", error)
      return {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to sign out",
        },
      }
    }
  }

  static async validateToken(
    token: string
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      // Check if token is blacklisted
      const blacklistedToken = await BlacklistedToken.findOne({ token })
      if (blacklistedToken) {
        return { valid: false }
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return { valid: true, userId: decoded.userId }
    } catch (error) {
      return { valid: false }
    }
  }
}
