import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "./env"
})

const port = process.env.PORT || 8000
connectDB()
    // .then(() => {
    //     app.listen(process.env.PORT || 8000, () => {
    //         console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    //     })
    // })
    // .catch((err) => {
    //     console.log("MONGO db connection failed !!! ", err);
    // })


    .then(() => {
        app.on("err", (error) => {
            console.error("some is wrong")
            throw error
        })
        app.listen(port, () => (console.log(`⚙️ server is running on the ${port}`)))
    })
    .catch((err) => {
        console.error("Mongodb connection failed", err)
    })












//import express from "express"
// const app = express()

//     ; (async () => {
//         try {
//             await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
//             app.on("error", (error) => {
//                 console.log("Error :", error)
//                 throw error
//             })
//             app.listen(process.env.PORT, () => {
//                 console.log("I am listening on " + process.env.PORT)
//             })
//         } catch (error) {
//             console.error("Error")
//             throw error
//         }
//     })()