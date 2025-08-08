import { Router } from "express";
import * as authService from "./auth.services.js";
const router = Router();

router.post("/signup", authService.signup);
router.post("/login", authService.login);
router.post("/social-login", authService.socialLogin);

router.patch("/confirm_email", authService.confirmEmail);
router.patch("/refresh", authService.refreshToken);
router.patch("/forget_password", authService.forgetPassword);
router.patch("/change_password", authService.changePassword);
router.patch("/resend-password-code", authService.resendOtp);
router.patch("/resend-confirm-code", authService.resendOtp);

export default router;
