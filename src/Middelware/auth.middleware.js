import jwt from "jsonwebtoken";
import { findById, findOne } from "../DB/DBservices.js";
import { userModel, Roles } from "../DB/Models/userModel.js";
import {
  invalidCredentials,
  notFoundUser,
  unauthorizedAccess,
  userIsNotActive,
} from "../Utils/errors.js";
import { revokedTokenModel } from "../DB/Models/revokedToken.model.js";
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
  const isRevoked = await findOne(revokedTokenModel, { jti: data.jti });
  if (isRevoked) {
    return next(new Error("this token is revoked", { cause: 401 }));
  }
  const user = await findById(userModel, { _id: data._id });
  if (!user) {
    return next(new notFoundUser());
  }
  if (user.credentialChangedAt?.getTime() >= data.iat * 1000) {
    return next(new Error("you should login again", { cause: 400 }));
  }

  return { user, decoded: data };
};

export const auth = (activation = true) => {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    const { user, decoded } = await decodeToken({ authorization, next });
    req.user = user;
    req.decoded = decoded;
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

export const checkUserBan = (otpType) => {
  return async (req, res, next) => {
    const { email } = req.body;

    const user = req.user || (await findOne(userModel, { email }));
    if (!user) {
      return next(new notFoundUser());
    }

    if (
      user[otpType].attempts >= 5 &&
      user[otpType].banExpiry &&
      user[otpType].banExpiry > Date.now()
    ) {
      const remainingMs = user[otpType].banExpiry - Date.now();
      const minutes = Math.floor(remainingMs / 1000 / 60);
      const seconds = Math.floor((remainingMs / 1000) % 60);
      return next(
        new Error(
          `you have exceeded the number of attempts wait ${minutes} minutes ${seconds} seconds`,
          { cause: 400 }
        )
      );
    } else if (
      user[otpType].banExpiry &&
      user[otpType].banExpiry <= Date.now()
    ) {
      user[otpType].attempts = 0;
      user[otpType].banExpiry = null;
      await user.save();
    }
    req.user = user;
    next();
  };
};

export const requestLimit = () => {
  return async (req, res, next) => {
    const { email } = req.body;
    const user = req.user || (await findOne(userModel, { email }));
    if (!user) {
      return next(new notFoundUser());
    }

    if (
      user.Requests.codeRequest >= 5 &&
      user.Requests.banExpiry &&
      user.Requests.banExpiry > Date.now()
    ) {
      const remainingMs = user.Requests.banExpiry - Date.now();
      const minutes = Math.floor(remainingMs / 1000 / 60);
      const seconds = Math.floor((remainingMs / 1000) % 60);
      return next(
        new Error(
          `you have exceeded the number of attempts wait ${minutes} minutes ${seconds} seconds`,
          { cause: 400 }
        )
      );
    } else if (
      user.Requests.banExpiry &&
      user.Requests.banExpiry <= Date.now()
    ) {
      user.Requests.codeRequest = 0;
      user.Requests.banExpiry = null;
      await user.save();
    }
    req.user = user;
    next();
  };
};
