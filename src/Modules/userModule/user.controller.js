import { Router } from "express";
import * as userServices from "./user.services.js";
import { auth } from "../../Middelware/auth.middleware.js";
import { validation } from "../../Middelware/validation.middleware.js";
import { updateProfileSchema } from "./user.validation.js";
const router = Router();

router.get("/share-profile", auth(), userServices.shareUserProfile);
router.get("/user-profile/:id", userServices.getUserProfile);
router.patch("/update", validation(updateProfileSchema), auth(), userServices.updateUserProfile);

export default router;
