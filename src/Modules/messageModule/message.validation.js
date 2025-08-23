import joi from "joi";
import { generalvalidation } from "../../Middelware/validation.middleware.js";

export const sendMessageSchema = {
  body: joi.object({
    from: joi.string().allow("", null).optional(),
    body: joi.string().allow("", null).optional(),
    to: generalvalidation.id.required(),
  }),
  files: joi.array().items(generalvalidation.file).max(5),
};
