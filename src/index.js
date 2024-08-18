import express from "express";
import http from "http";

import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";

import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

import router from "./router/index.js";
import connectMongoDB from "./db/connectMongoDB.js";

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình dotenv
dotenv.config({
  path: [".env.local", ".env"],
});

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Middleware khác
app.use(express.json());
app.use(cookieParser());
app.use(compression());

// Tạo và khởi động máy chủ HTTP
const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server is running on port 8080");
  connectMongoDB();
});

app.use("/", router());
