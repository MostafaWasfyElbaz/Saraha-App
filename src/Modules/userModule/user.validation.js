import joi from "joi";
import { generalvalidation } from "../../Middelware/validation.middleware.js";

export const updateProfileSchema = {
  body: joi.object({
    name: generalvalidation.name,
    phone: generalvalidation.phone,
  }),
};

export const checkIdSchema = {
  params: joi.object({
    id: generalvalidation.id.required(),
  }),
};

export const uploadImageSchema = {
  file: generalvalidation.file.required(),
};

export const uploadCoverImageSchema = {
  files: joi.array().items(generalvalidation.file).max(5).required(),
};