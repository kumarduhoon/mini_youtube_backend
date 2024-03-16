import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_APT_SECRET
});

const uploadOnCloudinary = async (loaclFilePath) => {
  try {
    if (!loaclFilePath) return null
    // file upload code
    const res = await cloudinary.uploader.upload(loaclFilePath,
      { resource_type: "auto" });
    // file upload response
    console.log(res.url)
    return res
  } catch (error) {
    //  fs.unlinkSync(loaclFilePath) // remove the locally saved temp file as the upload opertion got failed
    return null
  }
}

export { uploadOnCloudinary }