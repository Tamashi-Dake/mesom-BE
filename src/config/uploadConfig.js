import multer from "multer";

// Cấu hình multer để nhận các file ảnh từ form-data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 4,
  },
});

// const uploadToCloudinary = (file) => {
//   return new Promise((resolve, reject) => {
//       let stream = cloudinary.uploader.upload_stream((error, result) => {
//           if (result) {
//               resolve(result);
//           } else {
//               reject(error);
//           }
//       });

//       streamifier.createReadStream(file.buffer).pipe(stream);
//   });
// };

export default upload;
