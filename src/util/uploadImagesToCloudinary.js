import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const uploadImagesToCloudinary = async (files, folder) => {
  if (files.length === 0) return [];

  const imageSecureURLs = await Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        })
    )
  );

  return imageSecureURLs;
};

export default uploadImagesToCloudinary;
