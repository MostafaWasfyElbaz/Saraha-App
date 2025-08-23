import { Router } from "express";
import * as messageServices from "./message.services.js";
import { uploadImageCloud } from "../../Utils/multer/multer cloud.js";
import { validation } from "../../Middelware/validation.middleware.js";
import { sendMessageSchema } from "./message.validation.js";
import { auth } from "../../Middelware/auth.middleware.js";
const router = Router({ caseSensitive: true, strict: true, mergeParams: true });

router.get("/", messageServices.getUserMessages);
router.post(
  "/send-message",
  uploadImageCloud({ folder: "messages" }).array("images", 5),
  validation(sendMessageSchema),
  messageServices.sendMessage
);

export default router;
