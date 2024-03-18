import { Router } from "express"
import { registerUser, loginUser, logoutUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifiedUserWithJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/register").post(
    upload.fields(
        [{
            name: "avator",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }]),
    registerUser)

router.route("/login").post(loginUser)

// protected route 

router.route("/logout").post(verifiedUserWithJWT, logoutUser)

export default router