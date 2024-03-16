import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();

// middleware for handle cors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}))

// middleware for handle limit of json

app.use(express.json({ limit: "16kb" }))


// middleware for handle when we send the data by url   

app.use(express.urlencoded({ extended: true, limit: "16kb" }))

// for stroe the static image or file we used

app.use(express.static("public"))

// middleware for handle the cookie
app.use(cookieParser())

// all route
import userRouter from "./routes/user.routes.js";

// route decleartion

app.use("/api/v1/user", userRouter)
// http://localhost:3000/api/v1/user/register
export { app }