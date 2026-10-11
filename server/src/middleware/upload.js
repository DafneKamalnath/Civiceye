import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(), // keeps the file in memory as a buffer
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});