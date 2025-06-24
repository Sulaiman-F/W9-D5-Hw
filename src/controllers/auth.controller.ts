import { Request, Response } from "express"
import { AuthService } from "../services/auth.service"
import { AuthValidator } from "../utils/validators"
import {
  CONFLICT,
  UNAUTHORIZED,
  CREATED,
  OK,
  INTERNAL_SERVER_ERROR,
  BAD_REQUEST,
} from "../utils/http-status"
import { AuthRequest } from "../middleware/auth"

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validate input
    const validation = AuthValidator.validateSignup(email, password)
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

    // Call auth service
    const result = await AuthService.signup({ email, password })

    if (!result.success) {
      const statusCode =
        result.error?.code === "USER_EXISTS" ? CONFLICT : INTERNAL_SERVER_ERROR
      res.status(statusCode).json({
        success: false,
        error: result.error,
      })
      return
    }

    res.status(CREATED).json({
      success: true,
      data: { token: result.token },
      token: result.token,
    })
  } catch (error) {
    console.error("Signup controller error:", error)
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

    // Validate input
    const validation = AuthValidator.validateSignin(email, password)
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

    // Call auth service
    const result = await AuthService.signin({ email, password })

    if (!result.success) {
      const statusCode =
        result.error?.code === "INVALID_CREDENTIALS"
          ? UNAUTHORIZED
          : INTERNAL_SERVER_ERROR
      res.status(statusCode).json({
        success: false,
        error: result.error,
      })
      return
    }

    res.status(OK).json({
      success: true,
      data: { token: result.token },
      token: result.token,
    })
  } catch (error) {
    console.error("Signin controller error:", error)
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sign in",
      },
    })
  }
}

export const signout = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(" ")[1]

    if (!token || !req.user) {
      res.status(BAD_REQUEST).json({
        success: false,
        error: {
          code: "MISSING_TOKEN",
          message: "No token provided",
        },
      })
      return
    }

    // Call auth service
    const result = await AuthService.signout(token, String(req.user._id))

    if (!result.success) {
      res.status(INTERNAL_SERVER_ERROR).json({
        success: false,
        error: result.error,
      })
      return
    }

    res.status(OK).json({
      success: true,
      data: { message: "Successfully signed out" },
      token: null,
    })
  } catch (error) {
    console.error("Signout controller error:", error)
    res.status(INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to sign out",
      },
    })
  }
}
