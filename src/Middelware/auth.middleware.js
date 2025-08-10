import jwt from "jsonwebtoken";
import { findById } from "../DB/DBservices.js";
import { userModel, Roles } from "../DB/Models/userModel.js";
import {
  invalidCredentials,
  notFoundUser,
  unauthorizedAccess,
  userIsNotActive,
} from "../Utils/errors.js";
export const types = { access: "access", refresh: "refresh" };
Object.freeze(types);

export const decodeToken = async ({
  authorization,
  tokenType = types.access,
  next,
}) => {
  if (!authorization) {
    return next(new missingFields());
  }
  const [bearer, token] = authorization.split(" ");
  if (!bearer || !token) {
    return next(new invalidCredentials());
  }
  let signituer = "";

  switch (tokenType) {
    case types.access:
      signituer =
        bearer == Roles.user
          ? process.env.USER_ACCESS_SIGNITUER
          : process.env.ADMIN_ACCESS_SIGNITUER;
      break;
    case types.refresh:
      signituer =
        bearer == Roles.user
          ? process.env.USER_REFRESH_SIGNITUER
          : process.env.ADMIN_REFRESH_SIGNITUER;
      break;
  }
  const data = jwt.verify(token, signituer);
  const user = await findById(userModel, { _id: data._id });
  if (!user) {
    return next(new notFoundUser());
  }
  if (user.credentialChangedAt?.getTime() >= data.iat * 1000) {
    return next(new Error("you should login again", { cause: 400 }));
  }

  return user;
};

export const auth = (activation = true) => {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    req.user = await decodeToken({ authorization, next });
    if (activation) {
      if (!req.user.isActive) {
        return next(new userIsNotActive());
      }
    }
    next();
  };
};

export const allowTo = (...Roles) => {
  return async (req, res, next) => {
    const user = req.user;
    if (!Roles.includes(user.role)) {
      return next(new unauthorizedAccess());
    }
    next();
  };
};
