import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    // Kết nối MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connect to MongoDB successfully`);
  } catch (error) {
    console.error("Connect to MongoDB failed", error.message);
    process.exit(1);
  }
};

export default connectMongoDB;
