import 'module-alias/register.js'
import dotenv from 'dotenv'
// TODO: refactor dotenv trong 1 file
dotenv.config({
  path: '.env'
})
import http from 'http'

import app from './app.js'
import setupSocket from './lib/socket/index.js'
import connectMongoDB from './db/connectMongoDB.js'

// Tạo và khởi động máy chủ HTTP
const server = http.createServer(app)
setupSocket(server)

// onRender tự sinh PORT
const PORT = process.env.NODE_ENV === 'production' ? process.env.PORT || process.env.PROD_PORT : process.env.DEV_PORT

server.listen(PORT, () => {
  console.log(`Server running at production port ${PORT}`)
  connectMongoDB()
})
