import express from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";
const app = express();

dotenv.config({
  path: [".env.local", ".env"],
});

app.use(
  cors({
    credentials: true,
  })
);

app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression());

const server = http.createServer(app);

server.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// Connect to MongoDB
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.on("error", (err) => {
  console.error(err);
  process.exit();
});
