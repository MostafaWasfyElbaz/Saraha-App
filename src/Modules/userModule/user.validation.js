import joi from "joi";
import { generalvalidation } from "../../Middelware/validation.middleware.js";

export const updateProfileSchema = {
  body: joi.object({
    firstName: generalvalidation.firstName,
    lastName: generalvalidation.lastName,
    phone: generalvalidation.phone,
  }),
};

export const checkIdSchema = {
  params: joi.object({
    id: generalvalidation.id.required(),
  }),
};
