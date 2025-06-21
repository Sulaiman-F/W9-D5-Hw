import dotenv from "dotenv"
import express, { Express, Request, Response, NextFunction } from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import logger from "./utils/logger"
import { dev, port } from "./utils/helpers"
import authRoutes from "./routes/auth.route"
import weatherRoutes from "./routes/weather.route"
import historyRoutes from "./routes/history.route"
import { createRateLimiter } from "./middleware/rateLimiter"
import { OK, INTERNAL_SERVER_ERROR } from "./utils/http-status"
import { run } from "./config/database"

dotenv.config()

run().catch(console.dir)

const app: Express = express()

// middleware
app.use(createRateLimiter())
app.use(cors())
app.use(helmet())
app.use(
  morgan("tiny", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req: Request, res: Response) => {
  res.status(OK).json({
    success: true,
    data: { message: "WeatherHub API - Welcome!" },
  })
})

app.use("/auth", authRoutes)
app.use("/weather", weatherRoutes)
app.use("/history", historyRoutes)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Error:", err.message)
  res.status(INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Something went wrong!",
    error: dev ? err.message : undefined,
  })
})

app.listen(port, () => {
  logger.info(`Server is running http://localhost:${port}`)
})
