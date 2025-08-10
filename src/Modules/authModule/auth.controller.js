import { Router } from "express";
import * as authService from "./auth.services.js";
import { validation } from "../../Middelware/validation.middleware.js";
import {
  loginSchema,
  signupSchema,
  confirmEmailSchema,
  forgetPasswordSchema,
  changePasswordSchema,
  resendOtpSchema,
} from "./auth.validation.js";
const router = Router();

router.post("/signup", validation(signupSchema), authService.signup);
router.post("/login", validation(loginSchema), authService.login);
router.post("/social-login", authService.socialLogin);

router.patch(
  "/confirm_email",
  validation(confirmEmailSchema),
  authService.confirmEmail
);
router.patch("/refresh", authService.refreshToken);
router.patch(
  "/forget_password",
  validation(forgetPasswordSchema),
  authService.forgetPassword
);
router.patch(
  "/change_password",
  validation(changePasswordSchema),
  authService.changePassword
);
router.patch(
  "/resend-password-code",
  validation(resendOtpSchema),
  authService.resendOtp
);
router.patch(
  "/resend-confirm-code",
  validation(resendOtpSchema),
  authService.resendOtp
);

export default router;
