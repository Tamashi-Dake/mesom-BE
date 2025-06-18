import dotenv from "dotenv";
dotenv.config();

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.PROD_URL
      : process.env.DEV_FRONTEND_URL,
  credentials: true,
};

export default corsOptions;
