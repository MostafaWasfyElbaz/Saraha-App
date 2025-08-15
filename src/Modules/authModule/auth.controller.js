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
import {
  auth,
  checkUserBan,
  requestLimit,
} from "../../Middelware/auth.middleware.js";

const router = Router();

router.post("/signup", validation(signupSchema), authService.signup);
router.post("/login", validation(loginSchema), authService.login);
router.post("/social-login", authService.socialLogin);

router.patch("/refresh", authService.refreshToken);
router.patch(
  "/confirm_email",
  validation(confirmEmailSchema),
  checkUserBan("emailOTP"),
  authService.confirmEmail
);
router.patch(
  "/forget_password",
  validation(forgetPasswordSchema),
  authService.forgetPassword
);
router.patch(
  "/change_password",
  validation(changePasswordSchema),
  checkUserBan("passwordOTP"),
  authService.changePassword
);
router.patch(
  "/resend-password-code",
  validation(resendOtpSchema),
  requestLimit(),
  authService.resendOtp
);
router.patch(
  "/resend-email-confirm-code",
  validation(resendOtpSchema),
  requestLimit(),
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
  checkUserBan("newEmailOTP"),
  authService.confirmNewEmail
);
router.patch(
  "/resend-new-email-confirm-code",
  auth(),
  requestLimit(),
  authService.resendConfirmNewEmailCode
);
router.patch(
  "/update-password",
  validation(updatePasswordSchema),
  auth(),
  authService.updatePassword
);
export default router;
