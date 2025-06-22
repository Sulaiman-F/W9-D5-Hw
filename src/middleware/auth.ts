import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { User, IUser } from "../models/User"
import { BlacklistedToken } from "../models/BlacklistedToken"
import { UNAUTHORIZED } from "../utils/http-status"

export interface AuthRequest extends Request {
  user?: IUser
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      res.status(UNAUTHORIZED).json({
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "Access token is required",
        },
      })
      return
    }

    // Check if token is blacklisted
    const blacklistedToken = await BlacklistedToken.findOne({ token })
    if (blacklistedToken) {
      res.status(UNAUTHORIZED).json({
        success: false,
        error: {
          code: "TOKEN_BLACKLISTED",
          message: "Token has been invalidated. Please sign in again.",
        },
      })
      return
    }

    const decoded = jwt.verify(
      token,
      "your-super-secret-jwt-key-change-this-in-production-12345"
    ) as { userId: string }

    console.log("JWT verified successfully:", decoded)
    const user = await User.findById(decoded.userId)

    if (!user) {
      res.status(UNAUTHORIZED).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "User not found",
        },
      })
      return
    }

    req.user = user
    next()
  } catch (error) {
    res.status(UNAUTHORIZED).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "JWT expired or malformed",
      },
    })
  }
}
