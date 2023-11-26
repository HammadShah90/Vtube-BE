import express from "express";
import path from 'path'
import dotenv from 'dotenv'
import helmet from "helmet";
// import cors from "cors";
import connectDB from './db/connect.js'
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express()
const __dirname = path.resolve()
dotenv.config({ path: './.env' });

// Middlewares
// app.use(cors())
app.use(cookieParser())
app.use(express.json())

// Ruotes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/videos", videoRoutes)
app.use("/api/v1/comments", commentRoutes)


// Error Handling
app.use((err, req, res, next) => {
    const code = err.status || 500
    const message = err.message || "Something went wrong!"
    return res.status(code).send({
        Status: "Failed",
        code,
        message
    })
})


app.use('/api/v1', express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.send("ghalat jagah aagaey ho, aesa koi route hi nahin hai")
})


// Server
const PORT = process.env.PORT
const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running`)
        })
        await connectDB(process.env.MONGO_URL);
    } catch (error) {
        console.log(error);
    }
}
start()