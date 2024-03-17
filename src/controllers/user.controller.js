import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.util.js"
import { ApiResponse } from "../utils/apiResponse.js"

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

export { registerUser }