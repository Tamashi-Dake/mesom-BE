import express from 'express'
import cors from 'cors'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import router from './routes/index.js'
import corsOptions from './config/corsOptions.js'
import './config/cloudinary.js'

const app = express()

app.use(cors(corsOptions))
app.use(express.json({ limit: '5mb' }))
app.use(cookieParser())
app.use(compression())
app.use('/', router())

export default app
