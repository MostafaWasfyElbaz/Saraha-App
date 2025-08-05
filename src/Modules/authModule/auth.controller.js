import { Router } from "express";
import * as authService from "./auth.services.js";
const router = Router();

router.post("/signup", authService.signup);
router.post("/login", authService.login);

router.patch("/confirm_email", authService.confirmEmail);
router.patch("/refresh", authService.refreshToken);
router.patch("/forget_password", authService.forgetPassword);
router.patch("/change_password", authService.changePassword);

export default router;
