import { Router } from "express"
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, changeUserDetails, updatecoverImage } from "../controllers/user.controller.js";
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
router.route("/refresh-token").post(refreshAccessToken)

// protected route 

router.route("/logout").post(verifiedUserWithJWT, logoutUser)
router.route("/change-password").post(verifiedUserWithJWT, changeCurrentPassword)
router.route("/get-user").post(verifiedUserWithJWT, getCurrentUser)


export default router