import joi from "joi";
import { generalvalidation } from "../../Middelware/validation.middleware.js";

export const updateProfileSchema = joi.object({
  body: joi.object({
    name: generalvalidation.name,
    phone: generalvalidation.phone,
  }),
});
