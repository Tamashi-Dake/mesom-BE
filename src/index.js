import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoose from "mongoose";
import dotenv from "dotenv";
import router from "./router/index.js";

// Khởi tạo ứng dụng Express
const app = express();

// Cấu hình dotenv
dotenv.config({
  path: [".env.local", ".env"],
});

// Middleware CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Middleware body-parser (dùng tích hợp sẵn của Express)
app.use(express.json()); // Sử dụng express.json() thay cho bodyParser.json()

// Middleware khác
app.use(cookieParser());
app.use(compression());

// Tạo và khởi động máy chủ HTTP
const server = http.createServer(app);

server.listen(8080, () => {
  console.log("Server is running on port 8080");
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("error", (err) => {
  console.error(err);
  process.exit(1); // Sử dụng mã thoát 1 để chỉ ra lỗi
});

app.use("/", router());
