import { Router } from "express"
import { getCurrentWeather } from "../controllers/weather.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

router.get("/", authenticateToken, getCurrentWeather)

export default router
