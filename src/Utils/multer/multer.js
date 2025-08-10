import multer from "multer";
import fs from "fs";
import path from "path";

export const uploadImage = () => {
  const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      const dest = `uploads/${req.user.firstName}_${req.user.lastName}_${req.user._id}`;
      req.dest = dest;
      const fullDest = path.resolve(".", dest);
      if (!fs.existsSync(fullDest)) {
        fs.mkdirSync(fullDest, { recursive: true });
      }
      callback(null, fullDest);
    },
    filename: (req, file, callback) => {
      const fileName = `${req.user.firstName}_${req.user.lastName}_${file.originalname}`;
      callback(null, fileName);
    },
  });
  return multer({ storage });
};
