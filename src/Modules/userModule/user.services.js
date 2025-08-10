import { successHandler } from "../../Utils/successHandler.js";
import { findById, updateOne } from "../../DB/DBservices.js";
import { userModel } from "../../DB/Models/userModel.js";
import {
  notFoundUser,
  missingFields,
  unauthorizedAccess,
  deleteAdminAccount,
} from "../../Utils/errors.js";

import { Roles } from "../../DB/Models/userModel.js";
export const getUserProfile = async (req, res, next) => {
  const _id = req.params.id;
  const user = await findById(
    userModel,
    { _id },
    "firstName lastName email age gender profileImage"
  );

  if (!user) {
    return next(new notFoundUser());
  }
  user.profileImage = `${req.protocol}://${req.host}/${user.profileImage}`;
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
  const { firstName, lastName, phone } = req.body;
  if (!firstName && !lastName && !phone) {
    return next(new missingFields());
  }
  await updateOne(userModel, { _id: req.user._id }, { firstName, lastName, phone });
  successHandler({ res, data: { firstName, lastName, phone }, status: 200 });
};

export const deActivateUser = async (req, res, next) => {
  const { id } = req.params;
  const loggedUser = req.user;
  const user =
    loggedUser._id.toString() == id
      ? loggedUser
      : await findById(userModel, { _id: id });

  if (!user) {
    return next(new notFoundUser());
  }
  if (user.role == Roles.admin) {
    return next(new deleteAdminAccount());
  }
  if (
    user._id.toString() != loggedUser._id.toString() &&
    loggedUser.role != Roles.admin
  ) {
    return next(new unauthorizedAccess());
  }
  await updateOne(
    userModel,
    { _id: id },
    {
      isActive: false,
      deletedBy: { role: loggedUser.role, id: loggedUser._id },
    }
  );
  successHandler({ res, status: 200 });
};

export const activateUser = async (req, res, next) => {
  const { id } = req.params;
  const loggedUser = req.user;
  const user =
    loggedUser._id.toString() == id
      ? loggedUser
      : await findById(userModel, { _id: id });

  if (!user) {
    return next(new notFoundUser());
  }
  if (user.isActive) {
    return next(new Error("user is already active", { cause: 400 }));
  }
  if (loggedUser.role == Roles.user && user.deletedBy.role == Roles.admin) {
    return next(new Error("you can't activate this user", { cause: 400 }));
  }
  if (
    !(
      loggedUser.role == Roles.admin ||
      (loggedUser._id.toString() == id &&
        loggedUser.deletedBy.id.toString() == loggedUser._id.toString())
    )
  ) {
    return next(new unauthorizedAccess());
  }
  await updateOne(
    userModel,
    { _id: id },
    { isActive: true, $unset: { deletedBy: " " } }
  );
  successHandler({ res, status: 200 });
};

export const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  const user = await findById(userModel, { _id: id });
  if (!user) {
    return next(new notFoundUser());
  }
  if (user.role == Roles.admin) {
    return next(new deleteAdminAccount());
  }
  await deleteOne(userModel, { _id: id });
  successHandler({ res, status: 200 });
};

export const uploadImage = async (req, res, next) => {
  const user = req.user;
  if (!req.file) {
    return next(new missingFields());
  }
  user.profileImage = `${req.dest}/${req.file.filename}`;
  await user.save();
  successHandler({ res, status: 200 });
};
