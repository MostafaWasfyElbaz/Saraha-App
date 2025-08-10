import { Router } from "express";
import * as userServices from "./user.services.js";
import { auth } from "../../Middelware/auth.middleware.js";
import { validation } from "../../Middelware/validation.middleware.js";
import { updateProfileSchema } from "./user.validation.js";
import { allowTo } from "../../Middelware/auth.middleware.js";
import { Roles } from "../../DB/Models/userModel.js";
import { checkIdSchema } from "./user.validation.js";
import { uploadImage } from "../../Utils/multer/multer.js";
const router = Router();

router.get("/share-profile", auth(), userServices.shareUserProfile);
router.get(
  "/user-profile/:id",
  validation(checkIdSchema),
  userServices.getUserProfile
);

router.patch(
  "/update",
  validation(updateProfileSchema),
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
  "/upload-profile-image",
  auth(),
  uploadImage().single("image"),
  userServices.uploadImage
);
router.delete(
  "/delete/:id",
  validation(checkIdSchema),
  auth(),
  allowTo(Roles.admin),
  userServices.deleteUser
);

export default router;
