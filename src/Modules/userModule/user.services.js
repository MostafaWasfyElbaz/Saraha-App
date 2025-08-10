import { successHandler } from "../../Utils/successHandler.js";
import { findById, updateOne } from "../../DB/DBservices.js";
import { userModel } from "../../DB/Models/userModel.js";
import { notFoundUser, missingFields } from "../../Utils/errors.js";

export const getUserProfile = async (req, res, next) => {
  const _id = req.params.id;
  const user = await findById(userModel, { _id }, "name email age gender");

  if (!user) {
    return next(new notFoundUser());
  }
  successHandler({ res, data: user, status: 200 });
};

export const shareUserProfile = async (req, res, next) => {
  if (!req.user) {
    return next(new notFoundUser());
  }
  const link = `${req.protocol}://${req.host}/user/user-profile/${req.user._id}`;
  successHandler({ res, data: { link }, status: 200 });
};

export const updateUserProfile = async (req, res, next) => {
  if (!req.user) {
    return next(new notFoundUser());
  }
  const { name, phone } = req.body;
  if (!name && !phone) {
    return next(new missingFields());
  }
  await updateOne(userModel, { _id: req.user._id }, { name, phone });
  successHandler({ res, data: { name, phone }, status: 200 });
};
