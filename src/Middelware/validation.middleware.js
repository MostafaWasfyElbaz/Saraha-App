const dataMethods = ["body", "params", "query"];
import { gender, Roles } from "../DB/Models/userModel.js";
import joi from "joi";

export const validation = (schema) => {
  return (req, res, next) => {
    const errors = [];
    dataMethods.forEach((method) => {
      const result = schema[method]?.validate(req[method], {
        abortEarly: false,
      });
      if (result?.error) {
        errors.push(result.error);
      }
    });
    if (errors.length > 0) {
      return next(new Error(errors, { cause: 422 }));
    }
    next();
  };
};

export const generalvalidation = {
  email: joi.string().email().message("Please enter a valid email address."),
  phone: joi
    .string()
    .regex(new RegExp(/^[\+02|002]?01[0-9]{9}$/))
    .message(
      "Please enter a valid Egyptian phone number starting with +02 or 002 or 01."
    ),
  password: joi
    .string()
    .min(8)
    .message("Your password must be at least 8 characters long."),
  confirmPassword: joi.string().min(8).valid(joi.ref("password")),
  age: joi.number().min(18).message("Please enter a valid age."),
  gender: joi.string().valid(gender.mail, gender.femail),
  role: joi.string().valid(Roles.user, Roles.admin),
  otp: joi.string(),
  id: joi.string().length(24).message("Invalid user id"),
  name: joi.string().min(3).max(15),
};
