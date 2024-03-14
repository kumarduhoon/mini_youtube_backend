import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
        console.log(`\n DB connected ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Error", error)
        process.exit(1)
    }
}

export default connectDB