import { Router } from "express";
import * as authService from "./auth.services.js";
import { validation } from "../../Middelware/validation.middleware.js";
import * as authValidation from "./auth.validation.js";
import * as authMiddleware from "../../Middelware/auth.middleware.js";

const router = Router({ caseSensitive: true, strict: true });

router.post(
  "/signup",
  validation(authValidation.signupSchema),
  authService.signup
);
router.post(
  "/login",
  validation(authValidation.loginSchema),
  authService.login
);
router.post("/social-login", authService.socialLogin);
router.post("/logout", authMiddleware.auth(), authService.logout);

router.patch("/refresh", authService.refreshToken);
router.patch(
  "/confirm_email",
  validation(authValidation.confirmEmailSchema),
  authMiddleware.checkUserBan("emailOTP"),
  authService.confirmEmail
);
router.patch(
  "/forget_password",
  validation(authValidation.forgetPasswordSchema),
  authService.forgetPassword
);
router.patch(
  "/change_password",
  validation(authValidation.changePasswordSchema),
  authMiddleware.checkUserBan("passwordOTP"),
  authService.changePassword
);
router.patch(
  "/resend-password-code",
  validation(authValidation.resendOtpSchema),
  authMiddleware.requestLimit(),
  authService.resendOtp
);
router.patch(
  "/resend-email-confirm-code",
  validation(authValidation.resendOtpSchema),
  authMiddleware.requestLimit(),
  authService.resendOtp
);

router.patch(
  "/update-email",
  validation(authValidation.updateEmailSchema),
  authMiddleware.auth(),
  authService.updateUserEmail
);

router.patch(
  "/confirm-new-email",
  validation(authValidation.confirmNewEmailSchema),
  authMiddleware.auth(),
  authMiddleware.checkUserBan("newEmailOTP"),
  authService.confirmNewEmail
);
router.patch(
  "/resend-new-email-confirm-code",
  authMiddleware.auth(),
  authMiddleware.requestLimit(),
  authService.resendConfirmNewEmailCode
);
router.patch(
  "/update-password",
  validation(authValidation.updatePasswordSchema),
  authMiddleware.auth(),
  authService.updatePassword
);
export default router;
