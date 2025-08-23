import { Router } from "express";
import * as userServices from "./user.services.js";
import { auth } from "../../Middelware/auth.middleware.js";
import { validation } from "../../Middelware/validation.middleware.js";
import * as userValidation from "./user.validation.js";
import { allowTo } from "../../Middelware/auth.middleware.js";
import { Roles } from "../../DB/Models/userModel.js";
import { checkIdSchema } from "./user.validation.js";
import { uploadImage } from "../../Utils/multer/multer.js";
import { uploadImageCloud } from "../../Utils/multer/multer cloud.js";
import messagesRouter from "../messageModule/message.controller.js";
const router = Router({ caseSensitive: true, strict: true });

router.use("/user-profile/:id/messages", messagesRouter)

router.get("/share-profile", auth(), userServices.shareUserProfile);
router.get(
  "/user-profile/:id",
  validation(checkIdSchema),
  userServices.getUserProfile
);

router.patch(
  "/update",
  validation(userValidation.updateProfileSchema),
  auth(),
  userServices.updateUserProfile
);
router.patch(
  "/deactivate/:id",
  validation(checkIdSchema),
  auth(),
  userServices.deActivateUser
);
router.patch(
  "/activate/:id",
  validation(checkIdSchema),
  auth(false),
  userServices.activateUser
);
router.patch(
  "/local-upload-profile-image",
  auth(),
  uploadImage({ folder: "profile" }).single("image"),
  validation(userValidation.uploadImageSchema),
  userServices.localUploadProfileImage
);
router.patch(
  "/cloud-upload-profile-image",
  auth(),
  uploadImageCloud({}).single("image"),
  validation(userValidation.uploadImageSchema),
  userServices.cloudUploadProfileImage
);
router.patch(
  "/cloud-upload-cover-images",
  auth(),
  uploadImageCloud({ folder: "cover" }).array("images", 5),
  validation(userValidation.uploadCoverImageSchema),
  userServices.cloudUploadCoverImage
);

router.delete(
  "/delete/:id",
  validation(checkIdSchema),
  auth(),
  allowTo(Roles.admin),
  userServices.deleteUser
);

export default router;
