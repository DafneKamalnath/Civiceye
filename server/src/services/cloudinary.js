import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

/**
 * Upload a file buffer to Cloudinary and return the secure_url string.
 * @param {Buffer} buffer
 * @param {string} folder
 * @returns {Promise<string>}
 */
export function uploadImage(buffer, folder = "civiceye") {
  ensureConfig();
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      }
    );
    uploadStream.end(buffer);
  });
}

export { cloudinary };