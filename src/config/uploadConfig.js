import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import CloundinaryStorage from "multer-storage-cloudinary";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình storage cho multer
const storage = CloundinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "Mesom", // Tên thư mục trên Cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "gif"], // Định dạng cho phép
  },
});

// Cấu hình upload cho multer
const upload = multer({ storage: storage });

export default upload;
