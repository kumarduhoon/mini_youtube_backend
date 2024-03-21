import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.util.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { refreshToken, accessToken }
    } catch (error) {
        throw new ApiError("500", "some went wrong while generating token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get the user data from clinet 
    // validation on the data
    // check if user alerdy exits : username and email 
    // check for images
    // check for avater
    // upload the on cloudnery and 
    // create a user object - create db entry 
    // remove password and refresh token
    // check for the user creation then return response

    // 1. get the data from the client
    const { username, password, email, fullname } = req.body

    // 2.validation on the data
    // if (!username) {
    //     throw new ApiError(400, "username")
    // }
    if ([username, password, email, fullname].some((filed) => (filed.trim() === ""))) {
        throw new ApiError(400, "All field is required")
    }

    //  3. check if username and email is already exit
    const userExits = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExits) {
        throw new ApiError(409, "username or email already exits")
    }

    // 4. avator image
    const avatorLocalPath = req.files?.avator[0]?.path
    // const coverLocalPath = req.files?.coverImage[0]?.path

    let coverLocalPath;

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path
    }

    // 5. avator image is available or Not 

    if (!avatorLocalPath) {
        throw new ApiError(400, "myAvator file is required")
    }

    // 6. upload image on Cloudinary 
    const avator = await uploadOnCloudinary(avatorLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)
    console.log(avator, "my avator")
    // check avator is avaialbe or not

    if (!avator) {
        throw new ApiError(400, "Avator file is required")
    }

    // entry the data in database

    const user = await User.create({
        fullname,
        avator: avator.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    // check user is created or not

    const userDataWith_id = await User.findById(user._id).select("-password -refreshToken")

    if (!userDataWith_id) {
        throw new ApiError(500, "something went wrong while creating user")
    }

    // now sent the respose to the user

    return res.status(201).json(
        new ApiResponse(200, userDataWith_id, "user register succesfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    /* 1. Get data from client
       2. check username and email are there
       3. check the username in database if user there then go to next 4
       4.  check the password is correct or not then
       5. generate the access and refresh token
       6. sent the token in cookies
       7. then send the repose to user   */

    const { email, username, password } = req.body
    if (!(email || username)) {
        throw new ApiError(400, "email or user required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(401, "user does not exits")
    }

    if (!password) {
        throw new ApiError(400, "passpord is required")
    }

    const isPassworsvalid = await user.isPasswordCorrect(password)
    if (!isPassworsvalid) {
        throw new ApiError(401, "passpord and username is incorrent")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("refreshaToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200,
            {
                loggedInUser,
                refreshToken,
                accessToken
            }, "user logged In successfully"))

})

//  when user logged in
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: undefined // this removes the field from document
        }
    },
        {
            new: true
        })

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logout successfully"))
})


//  regenerate the refresher and access token

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {

        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

//  when user logged in
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "invalid password")
    }

    user.password = newPassword
    user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password change Successfully"))

})

//  when user logged in
const getCurrentUser = asyncHandler(async (req, res) => {
    const currentUser = req.user
    if (!currentUser) {
        throw new ApiError(400, "bad request")
    }
    return res.status(200).json(new ApiResponse(200, currentUser, "user got successfully"))
})

const changeUserDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body;
    if (!fullname || !email) {
        throw new ApiError(400, "All field are required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname, email
        }
    }, {
        new: true
    }).select("-password")
    if (!user) {
        throw new ApiError(400, "something is wrong")
    }
    return res.status(200)
        .json(new ApiResponse(200, user, "User details changed successfully "))
})


const updateAvatorImage = asyncHandler(async (req, res) => {
    const avatorLocalPath = req.file?.path
    if (!avatorLocalPath) {
        throw new ApiError(400, "Avator is missing")
    }
    const avator = await uploadOnCloudinary(avatorLocalPath)
    if (!avator.url) {
        throw new ApiError(400, "Error while uploading the image")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avator: avator.url
        }
    }, {
        new: true
    }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Avator changed successfully"))
})


const updatecoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading the image")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, {
        new: true
    }).select("-password")

    return res.status(200)
        .json(new ApiResponse(200, user, "Cover Image changed successfully"))
})



// how to get all the user info user the join or aggregation pipeline



const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "user does not exists")
    }
    // aggregation pipeline for join the table
    const channel = await User.aggregate([
        {  // find the user by matching the username
            $match: {
                username: username?.toLowerCase()
            }
        }, // now find the subscribtion  
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "my_subscriber"
            }
        }, // how many channel i subscriber
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id", // jis ka ref diya 
                foreignField: "subscriber", // foreignfield me jis me ref  diya hai,
                as: "my_subscribed_channel"
            }
        },
        {
            $addFields: {
                my_subscriber_count: {
                    $size: "$my_subscriber"
                },
                my_subscribed_channel_count: {
                    $size: "$my_subscribed_channel"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$my_subscriber.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                my_subscriber_count: 1,
                my_subscribed_channel_count: 1,
                isSubscribed: 1,
                avator: 1,
                coverImage: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "User channel fetched successfully"))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "vidoes", // kha se kru look up mean kon se mode se look kru for example m abhi user hu to jis ka ref diya hai user m uska from m use hoga
                localField: "watchHistory", // jis m video or " in gernal filed ref hoga" ka ref hoga 
                foreignField: "_id",
                as: "watch_history",
                pipeline: [
                    {
                        $lookup: {
                            from: "users", // make name in lower case and parular as per mogones rule
                            localField: "owner",
                            foreignField: "_id",
                            as: "video_owner",
                            pipeline: [{
                                $project: {
                                    fullname: 1,
                                    username: 1,
                                    avator: 1
                                }
                            }]
                        }
                    },
                    //we get the first element from the array pipeline
                    {
                        $addFields: {
                            owner: {
                                $first: "$video_owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "get all the histroy sucessully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    changeUserDetails,
    updateAvatorImage,
    updatecoverImage,
    getUserChannelProfile,
    getWatchHistory
}