import express from "express"

const app = express();

app.get("/", (req, res) => {
    res.send("My first server")
})

app.listen(2000, () => (console.log("server is ready to work")))