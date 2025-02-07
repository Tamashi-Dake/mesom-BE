import multer from "multer";

// Cấu hình multer để nhận các file ảnh từ form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 4,
  },
});

export default upload;
