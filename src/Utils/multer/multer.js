import multer from "multer";
import fs from "fs";
import path from "path";

export const fileType = {
  image: ["image/gif", "image/jpeg", "image/jpg", "image/png", "image/webp"],
  video: ["video/mp4", "video/webm"],
};
Object.freeze(fileType);

export const uploadImage = ({ folder = "general", type = fileType.image }) => {
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      const dest = `src/uploads/${req.user._id}/${folder}`;

      if (folder == "profile" && fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true });
      }

      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      req.dest = dest;
      callback(null, dest);
    },
    filename: (req, file, callback) => {
      const fileName = `${Date.now()}_${file.originalname}`;
      callback(null, fileName);
    },
  });
  const fileFilter = (req, file, callback) => {
    if (type.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error("Invalid file type"), false);
    }
  };
  return multer({ storage, fileFilter });
};
