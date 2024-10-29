import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    // Kết nối MongoDB
    const conn = await mongoose.connect(
      process.env.NODE_ENV === "production"
        ? process.env.MONGO_PROD_URI
        : process.env.MONGO_URI
    );
    console.log(`Connect to MongoDB successfully`);
    // Lấy thông tin database hiện tại
    // console.log(`Connected to MongoDB: ${conn.connection.host}`);
    // console.log(`Database name: ${conn.connection.name}`); // In ra tên database đang kết nối
  } catch (error) {
    console.error("Connect to MongoDB failed", error.message);
    process.exit(1);
  }
};

export default connectMongoDB;
