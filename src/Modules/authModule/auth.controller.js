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
  updateEmailSchema,
  confirmNewEmailSchema,
  updatePasswordSchema,
} from "./auth.validation.js";

import { auth } from "../../Middelware/auth.middleware.js";

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
  auth(),
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

router.patch(
  "/update-email",
  validation(updateEmailSchema),
  auth(),
  authService.updateUserEmail
);

router.patch(
  "/confirm-new-email",
  validation(confirmNewEmailSchema),
  auth(),
  authService.confirmNewEmail
);
router.patch(
  "/resend-confirm-email-code",
  auth(),
  authService.resendConfirmEmailCode
);
router.patch(
  "/update-password",
  validation(updatePasswordSchema),
  auth(),
  authService.updatePassword
);
export default router;
