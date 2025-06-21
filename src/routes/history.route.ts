import { Router } from "express"
import { getHistory } from "../controllers/history.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Protected history route
router.get("/", authenticateToken, getHistory)

export default router
