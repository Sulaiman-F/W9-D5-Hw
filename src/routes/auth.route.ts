import { Router } from "express"
import { signup, signin, signout } from "../controllers/auth.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

router.post("/signup", signup)
router.post("/signin", signin)
router.post("/signout", authenticateToken, signout)

export default router
