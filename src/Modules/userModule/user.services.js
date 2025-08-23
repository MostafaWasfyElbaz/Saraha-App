import { successHandler } from "../../Utils/successHandler.js";
import { deleteOne, findById, updateOne } from "../../DB/DBservices.js";
import { userModel } from "../../DB/Models/userModel.js";
import * as errorRes from "../../Utils/errors.js";
import { Roles } from "../../DB/Models/userModel.js";
import fs from "fs";
import * as cloudinaryServices from "../../Utils/multer/cloudinary.services.js";

export const getUserProfile = async (req, res, next) => {
  const _id = req.params.id;
  const user = await findById(
    userModel,
    { _id },
    "firstName lastName email age gender localProfileImage cloudProfileImage cloudCoverImage"
  );

  if (!user) {
    return next(new errorRes.notFoundUser());
  }
  user.localProfileImage = user.localProfileImage
    ? `${req.protocol}://${req.host}/${user.localProfileImage}`
    : null;
  user.cloudProfileImage = user.cloudProfileImage
    ? `${req.protocol}://${req.host}/${user.cloudProfileImage}`
    : null;
  user.cloudCoverImage = user.cloudCoverImage
    ? `${req.protocol}://${req.host}/${user.cloudCoverImage}`
    : null;

  successHandler({ res, data: user, status: 200 });
};

export const shareUserProfile = async (req, res, next) => {
  if (!req.user) {
    return next(new errorRes.notFoundUser());
  }
  const link = `${req.protocol}://${req.host}/user/user-profile/${req.user._id}`;
  successHandler({ res, data: { link }, status: 200 });
};

export const updateUserProfile = async (req, res, next) => {
  if (!req.user) {
    return next(new errorRes.notFoundUser());
  }
  const { name, phone } = req.body;
  if (!name && !phone) {
    return next(new errorRes.missingFields());
  }
  await updateOne(userModel, { _id: req.user._id }, { name, phone });
  successHandler({ res, data: { name, phone }, status: 200 });
};

export const deActivateUser = async (req, res, next) => {
  const { id } = req.params;
  const loggedUser = req.user;
  const user =
    loggedUser._id.toString() == id
      ? loggedUser
      : await findById(userModel, { _id: id });

  if (!user) {
    return next(new errorRes.notFoundUser());
  }
  if (user.role == Roles.admin) {
    return next(new errorRes.deleteAdminAccount());
  }
  if (
    user._id.toString() != loggedUser._id.toString() &&
    loggedUser.role != Roles.admin
  ) {
    return next(new errorRes.unauthorizedAccess());
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
    return next(new errorRes.notFoundUser());
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
    return next(new errorRes.unauthorizedAccess());
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
    return next(new errorRes.notFoundUser());
  }
  if (user.role == Roles.admin) {
    return next(new errorRes.deleteAdminAccount());
  }
  try {
    const dir = user.localProfileImage.split("/");
    dir.pop();
    dir.pop();
    const folderPath = dir.join("/");
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true });
    }
  } catch (error) {
    await cloudinaryServices.deleteFolderResources(`users/${user._id}`);
    await cloudinaryServices.deleteFolder(`users/${user._id}`);
  }
  await deleteOne(userModel, { _id: id });
  successHandler({ res, status: 200 });
};

export const localUploadProfileImage = async (req, res, next) => {
  const user = req.user;
  if (!req.file) {
    return next(new errorRes.missingFields());
  }
  user.localProfileImage = `${req.dest}/${req.file.filename}`;
  await user.save();
  successHandler({ res, status: 200 });
};

export const cloudUploadProfileImage = async (req, res, next) => {
  const user = req.user;
  console.log(req.file);
  if (!req.file) {
    return next(new errorRes.missingFields());
  }
  const { public_id, secure_url } = await cloudinaryServices.uploadSingleFile({
    path: req.file.path,
    folder: `users/${user._id}/profile`,
  });
  if (user.cloudProfileImage) {
    await cloudinaryServices.destroyFile(user.cloudProfileImage.public_id);
  }
  user.cloudProfileImage = { public_id, secure_url };
  await user.save();
  successHandler({ res, status: 200 });
};

export const cloudUploadCoverImage = async (req, res, next) => {
  const user = req.user;
  if (!req.files) {
    return next(new errorRes.missingFields());
  }
  const paths = [];
  for (const image of req.files) {
    paths.push(image.path);
  }
  const coverImagesInfo = await cloudinaryServices.uploadMultipleFiles({
    paths,
    dest: `users/${user._id}/cover`,
  });
  user.cloudCoverImage = coverImagesInfo;
  await user.save();

  successHandler({ res, status: 200 });
};
