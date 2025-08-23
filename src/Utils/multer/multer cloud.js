import multer from "multer";

export const fileType = {
  image: ["image/gif", "image/jpeg", "image/jpg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm"],
};
Object.freeze(fileType);

export const uploadImageCloud = ({ type = fileType.image }) => {
  const storage = multer.diskStorage({});
  const fileFilter = (req, file, callback) => {
    if (!file) {
      return callback(new Error("No file uploaded"), false);
    }
    if (type.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Invalid file type"), false);
    }
  };
  return multer({ storage, fileFilter });
};
