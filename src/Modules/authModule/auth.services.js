import { Roles, userModel, providers } from "../../DB/Models/userModel.js";
import { findOne, create, updateOne } from "../../DB/DBservices.js";
import { successHandler } from "../../Utils/successHandler.js";
import {
  emailEmitter,
  createOTP,
} from "../../Utils/SendEmails/emailEmitter.js";
import jwt from "jsonwebtoken";
import { decodeToken, types } from "../../Middelware/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";
import * as errorRes from "../../Utils/errors.js";
import { nanoid } from "nanoid";
import { revokedTokenModel } from "../../DB/Models/revokedToken.model.js";

const client = new OAuth2Client();

export const signup = async (req, res, next) => {
  const { name, role, email, password, phone, age, gender } = req.body;

  const user = await findOne(userModel, { email });
  if (user) {
    return next(new errorRes.existEmail());
  }
  const confirmOtp = createOTP();
  emailEmitter.emit("confirmEmail", email, confirmOtp, name);
  const newUser = await create(userModel, {
    name,
    email,
    phone,
    password,
    emailOTP: {
      otp: confirmOtp,
      expiresIn: Date.now() + Number(process.env.OTP_EXPIRATION),
      banExpiry: null,
      attempts: 0,
    },
    age,
    gender,
    role,
    Requests: { codeRequest: 0, banExpiry: null },
  });

  return successHandler({ res, status: 201, data: newUser });
};

export const confirmEmail = async (req, res, next) => {
  const { otp } = req.body;

  const user = req.user;

  if (!user.emailOTP.otp || user.confirmed) {
    return next(new errorRes.emailAlreadyConfirmed());
  }
  const isMatch = await user.comparePass(otp, user.emailOTP.otp);
  if (!isMatch) {
    user.emailOTP.attempts++;
    if (user.emailOTP.attempts >= 5) {
      user.emailOTP.banExpiry = Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.invalidCredentials());
  }
  if (user.emailOTP.expiresIn <= Date.now()) {
    user.emailOTP.attempts++;
    if (user.emailOTP.attempts >= 5) {
      user.emailOTP.banExpiry = Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.expiredCode());
  }
  await updateOne(
    userModel,
    { _id: user._id },
    { confirmed: true, $unset: { emailOTP: "" } }
  );
  return successHandler({ res, status: 200 });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await findOne(userModel, { email });

  if (!user) {
    return next(new errorRes.notFoundUser());
  }
  if (user.provider != providers.system) {
    return next(new Error("you can't login with system login", { cause: 400 }));
  }
  if (!user.confirmed) {
    return next(new errorRes.emailNotConfirmed());
  }
  const isMatch = await user.comparePass(password, user.password);
  if (!isMatch) {
    return next(new errorRes.invalidCredentials());
  }
  const payload = { _id: user._id };
  const jwtid = nanoid();
  const accessSigniture =
    user.role == Roles.user
      ? process.env.USER_ACCESS_SIGNITUER
      : process.env.ADMIN_ACCESS_SIGNITUER;

  const refreshSigniture =
    user.role == Roles.user
      ? process.env.USER_REFRESH_SIGNITUER
      : process.env.ADMIN_REFRESH_SIGNITUER;

  const accessToken =
    `${user.role} ` +
    jwt.sign(payload, accessSigniture, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
      jwtid,
    });
  const refreshToken =
    `${user.role} ` +
    jwt.sign(payload, refreshSigniture, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
      jwtid,
    });
  successHandler({
    res,
    status: 200,
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return next(new errorRes.missingFields());
  }
  const { user, decoded } = await decodeToken({
    authorization,
    tokenType: types.refresh,
    next,
  });
  const payload = { _id: user._id };
  const accessToken = jwt.sign(
    payload,
    user.role == Roles.user
      ? process.env.USER_ACCESS_SIGNITUER
      : process.env.ADMIN_ACCESS_SIGNITUER,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION, jwtid: decoded.jti }
  );
  successHandler({
    res,
    data: { accessToken: `${user.role} ${accessToken}` },
    status: 200,
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new errorRes.notFoundUser());
  }
  if (!user.confirmed) {
    return next(new errorRes.emailNotConfirmed());
  }
  if (user.passwordOTP.otp) {
    return next(new Error("try to resend code", { cause: 400 }));
  }
  const passwordOtp = createOTP();
  emailEmitter.emit("forgetPassword", email, passwordOtp, user.name);
  user.passwordOTP.otp = passwordOtp;
  user.passwordOTP.expiresIn = Date.now() + Number(process.env.OTP_EXPIRATION);
  user.passwordOTP.attempts = 0;
  user.passwordOTP.banExpiry = null;
  user.Requests.codeRequest = 0;
  await user.save();
  successHandler({ res, status: 200 });
};

export const changePassword = async (req, res, next) => {
  const { otp, newPassword } = req.body;
  const user = req.user;
  if (!user.confirmed) {
    return next(new errorRes.emailNotConfirmed());
  }
  const isMatch = await user.comparePass(otp, user.passwordOTP.otp);
  if (!isMatch) {
    user.passwordOTP.attempts++;
    if (user.passwordOTP.attempts >= 5) {
      user.passwordOTP.banExpiry =
        Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.invalidCredentials());
  }
  if (user.passwordOTP.expiresIn <= Date.now()) {
    user.passwordOTP.attempts++;
    if (user.passwordOTP.attempts >= 5) {
      user.passwordOTP.banExpiry =
        Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.expiredCode());
  }
  await updateOne(
    userModel,
    { _id: user._id },
    {
      credentialChangedAt: Date.now(),
      password: newPassword,
      $unset: {
        passwordOTP: "",
      },
    }
  );
  successHandler({ res, status: 200 });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new errorRes.notFoundUser());
  }
  const otp = createOTP();
  const type = req.url.includes("password")
    ? "passwordOTP"
    : user.confirmed == true
    ? null
    : "emailOTP";
  const event = req.url.includes("password")
    ? "forgetPassword"
    : user.confirmed == true
    ? null
    : "confirmEmail";
  if (type == null && event == null) {
    return next(new errorRes.emailAlreadyConfirmed());
  }
  emailEmitter.emit(event, email, otp, user.name);
  user.Requests.codeRequest++;
  if (user.Requests.codeRequest >= 5) {
    user.Requests.banExpiry = Date.now() + Number(process.env.BAN_EXPIRATION);
  }
  user[type].otp = otp;
  user[type].expiresIn = Date.now() + Number(process.env.OTP_EXPIRATION);
  await user.save();
  successHandler({ res, status: 200 });
};

export const socialLogin = async (req, res, next) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });

  const { email, name } = ticket.getPayload();
  const user = await userModel.findOne({ email });
  if (user?.confirmed == false) {
    return next(new errorRes.emailNotConfirmed());
  }
  if (!user) {
    await create(userModel, {
      email,
      name,
      provider: providers.google,
      confirmed: true,
    });
  }

  const payload = { _id: user._id, email: user.email };

  const accessToken =
    `${user.role} ` +
    jwt.sign(payload, process.env.USER_ACCESS_SIGNITUER, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });
  const refreshToken =
    `${user.role} ` +
    jwt.sign(payload, process.env.USER_REFRESH_SIGNITUER, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    });
  successHandler({
    res,
    data: {
      accessToken,
      refreshToken,
    },
  });
};

export const updateUserEmail = async (req, res, next) => {
  const { newEmail } = req.body;
  const user = req.user;
  if (!user.confirmed) {
    return next(new errorRes.emailNotConfirmed());
  }
  if (user.newEmailOTP.otp) {
    return next(new Error("try to resend code", { cause: 400 }));
  }
  const isExist = await findOne(userModel, { email: newEmail });
  if (isExist || user.email == newEmail) {
    return next(new errorRes.existEmail());
  }
  const oldEmailConfirmOtp = createOTP();
  const newEmailConfirmOtp = createOTP();
  emailEmitter.emit("confirmEmail", user.email, oldEmailConfirmOtp, user.name);
  emailEmitter.emit("confirmEmail", newEmail, newEmailConfirmOtp, user.name);
  await updateOne(
    userModel,
    { _id: user._id },
    {
      Requests: { codeRequest: 0, banExpiry: null },
      newEmail,
      newEmailOTP: {
        otp: newEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.OTP_EXPIRATION),
        attempts: 0,
        banExpiry: null,
      },
      emailOTP: {
        otp: oldEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.OTP_EXPIRATION),
      },
    }
  );
  successHandler({ res, status: 200 });
};

export const confirmNewEmail = async (req, res, next) => {
  const user = req.user;
  const { otp, newOtp } = req.body;

  if (!user.newEmailOTP.otp || !user.emailOTP.otp) {
    return next(new errorRes.emailAlreadyConfirmed());
  }
  if (
    !(await user.comparePass(otp, user.emailOTP.otp)) ||
    !(await user.comparePass(newOtp, user.newEmailOTP.otp))
  ) {
    user.newEmailOTP.attempts++;
    if (user.newEmailOTP.attempts >= 5) {
      user.newEmailOTP.banExpiry =
        Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.invalidCredentials());
  }
  if (
    user.newEmailOTP.expiresIn <= Date.now() ||
    user.emailOTP.expiresIn <= Date.now()
  ) {
    user.newEmailOTP.attempts++;
    if (user.newEmailOTP.attempts >= 5) {
      user.newEmailOTP.banExpiry =
        Date.now() + Number(process.env.BAN_EXPIRATION);
    }
    await user.save();
    return next(new errorRes.expiredCode());
  }
  await updateOne(
    userModel,
    { _id: user._id },
    {
      credentialChangedAt: Date.now(),
      email: user.newEmail,
      $unset: { newEmail: "", emailOTP: "", newEmailOTP: "" },
    }
  );
  successHandler({ res, status: 200 });
};

export const resendConfirmNewEmailCode = async (req, res, next) => {
  const user = req.user;
  const oldEmailConfirmOtp = createOTP();
  const newEmailConfirmOtp = createOTP();
  emailEmitter.emit("confirmEmail", user.email, oldEmailConfirmOtp, user.name);
  emailEmitter.emit(
    "confirmEmail",
    user.newEmail,
    newEmailConfirmOtp,
    user.name
  );
  user.Requests.codeRequest++;
  if (user.Requests.codeRequest >= 5) {
    user.Requests.banExpiry = Date.now() + Number(process.env.BAN_EXPIRATION);
  }
  await user.save();
  await updateOne(
    userModel,
    { _id: user._id },
    {
      newEmailOTP: {
        otp: newEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.OTP_EXPIRATION),
      },
      emailOTP: {
        otp: oldEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.OTP_EXPIRATION),
      },
    }
  );
  successHandler({ res, status: 200 });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;
  if (!user.confirmed) {
    return next(new errorRes.emailNotConfirmed());
  }

  if (!(await user.comparePass(oldPassword, user.password))) {
    return next(new errorRes.invalidCredentials());
  }
  for (const password of user.oldPasswords) {
    if (await user.comparePass(newPassword, password)) {
      return next(new Error("this password used before", { cause: 400 }));
    }
  }
  user.oldPasswords.push(user.password);
  user.password = newPassword;
  user.credentialChangedAt = Date.now();
  await user.save();
  successHandler({ res, status: 200 });
};

export const logout = async (req, res, next) => {
  const user = req.user;
  const tokenData = req.decoded;
  await create(revokedTokenModel, {
    jti: tokenData.jti,
    expireIn: Date.now() + 7 * 24 * 60 * 60,
    user: user._id,
  });
  successHandler({ res, status: 200 });
};

export const lofoutAll = async (req, res, next) => {
  const user = req.user;
  user.credentialChangedAt = Date.now();
  await user.save();
  successHandler({ res, status: 200 });
};
