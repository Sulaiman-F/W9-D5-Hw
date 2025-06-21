import { Request, Response } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import {
  CONFLICT,
  UNAUTHORIZED,
  CREATED,
  OK,
  INTERNAL_SERVER_ERROR,
  BAD_REQUEST,
} from "../utils/http-status"

const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production-12345"

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Email and password are required",
        },
      })
      return
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(CONFLICT).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: "User with this email already exists",
        },
      })
      return
    }

    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
      email,
      passwordHash,
      role: "user",
    })

    await user.save()

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
      expiresIn: "1d",
    })

    res.status(CREATED).json({
      success: true,
      data: { token },
    })
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create user",
      },
    })
  }
}

export const signin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "MISSING_FIELDS",
          message: "Email and password are required",
        },
      })
      return
    }

    const user = await User.findOne({ email })
    if (!user) {
      res.status(UNAUTHORIZED).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      })
      return
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      res.status(UNAUTHORIZED).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      })
      return
    }

    const token = jwt.sign({ userId: String(user._id) }, JWT_SECRET, {
      expiresIn: "1d",
    })

    res.status(OK).json({
      success: true,
      data: { token },
    })
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sign in",
      },
    })
  }
}

export const signout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(OK).json({
      success: true,
      data: { message: "Successfully signed out" },
    })
  } catch (error) {
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sign out",
      },
    })
  }
}
