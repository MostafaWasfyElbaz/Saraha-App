import joi from "joi";
import { generalvalidation } from "../../Middelware/validation.middleware.js";

export const signupSchema = {
  body: joi.object({
    name: generalvalidation.name.required(),
    email: generalvalidation.email.required(),
    phone: generalvalidation.phone.required(),
    password: generalvalidation.password.required(),
    confirmPassword: generalvalidation.confirmPassword.required(),
    age: generalvalidation.age.required(),
    gender: generalvalidation.gender,
    role: generalvalidation.role,
  }),
};

export const loginSchema = {
  body: joi.object({
    email: generalvalidation.email.required(),
    password: generalvalidation.password.required(),
  }),
};

export const confirmEmailSchema = {
  body: joi.object({
    email: generalvalidation.email.required(),
    otp: generalvalidation.otp.required(),
  }),
};

export const forgetPasswordSchema = {
  body: joi.object({
    email: generalvalidation.email.required(),
  }),
};

export const changePasswordSchema = {
  body: joi.object({
    email: generalvalidation.email.required(),
    otp: generalvalidation.otp.required(),
    newPassword: generalvalidation.password.required(),
  }),
};

export const resendOtpSchema = {
  body: joi.object({
    email: generalvalidation.email.required(),
  }),
};
