import express  from "express";
import path from 'path'
import dotenv from 'dotenv'
import connectDB from './db/connect.js'

const app = express()
const __dirname = path.resolve()
dotenv.config({ path: './.env' });

app .use(express.json())


app.use('/api/v2', express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.send("ghalat jagah aagaey ho, aesa koi route hi nahin hai")
})


const PORT = process.env.PORT
const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Connected with Server`)
        })
        await connectDB(process.env.MONGO_URL);
    } catch (error) {
        console.log(error);
    }
}
start()