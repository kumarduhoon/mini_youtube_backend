import { Router } from "express"
import {
    registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, changeUserDetails, updatecoverImage,
    updateAvatorImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
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
router.route("/get-user").get(verifiedUserWithJWT, getCurrentUser)
router.route("/update-details").patch(verifiedUserWithJWT, changeUserDetails)
router.route("/avatar").patch(verifiedUserWithJWT, upload.single("avator"), updateAvatorImage)
router.route("/cover-image").patch(verifiedUserWithJWT, upload.single("coverImage"), updatecoverImage)
router.route("/c/:username").get(verifiedUserWithJWT, getUserChannelProfile)
router.route("/watch-hostory").get(verifiedUserWithJWT, getWatchHistory)



export default router