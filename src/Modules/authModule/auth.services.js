import { Roles, userModel, providers } from "../../DB/Models/userModel.js";
import { findOne, create, updateOne } from "../../DB/DBservices.js";
import { successHandle } from "../../Utils/successHandles.js";
import {
  emailEmitter,
  creatOTP,
} from "../../Utils/ConfirmEmail/emailEmitter.js";
import jwt from "jsonwebtoken";
import { decodeToken, types } from "../../Middelware/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client();
export const signup = async (req, res, next) => {
  const { name, email, password, phone, age, gender = "mail" } = req.body;
  if (!name || !email || !password || !phone || !age) {
    return next(new Error("Missing required fields", { cause: 422 }));
  }
  const user = await findOne(userModel, { email });
  if (user) {
    return next(new Error("Email already exists", { cause: 409 }));
  }
  const confirmOtp = creatOTP();
  const newUser = await create(userModel, {
    name,
    email,
    phone,
    password,
    emailOTP: {
      otp: confirmOtp,
      expiresIn: Date.now() + 60 * 1000,
    },
    age,
    gender,
  });

  emailEmitter.emit("confirmEmail", email, confirmOtp);

  return successHandle({ res, status: 201, data: newUser });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new Error("Email and OTP are required", { cause: 400 }));
  }

  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new Error("Invalid credentials", { cause: 404 }));
  }
  if (user.emailOTP.expiresIn <= Date.now()) {
    return next(new Error("otp expired ... try to resend it", { cause: 400 }));
  }
  if (!!user.emailOTP.otp) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }
  const isMatch = await user.comparePass(otp, user.emailOTP.otp);
  if (!isMatch) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }
  await updateOne(
    userModel,
    { email },
    { confirmed: true, $unset: { emailOTP: "" } }
  );
  return successHandle({ res, status: 200 });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    next(new Error("invalid credintial", { cause: 404 }));
  }
  const user = await findOne(userModel, { email });

  if (!user) {
    next(new Error("user not found", { cause: 404 }));
  }
  if (!user.confirmed || user.emailOTP.otp) {
    next(new Error("you should confirm the Email", { cause: 404 }));
  }
  const isMatch = await user.comparePass(password, user.password);
  if (!isMatch) {
    return next(new Error("invalid credintials", { status: 404 }));
  }
  const payload = { _id: user._id };

  const accessSigniture =
    user.role == Roles.user
      ? process.env.USER_ACCESS_SIGNITUER
      : process.env.ADMIN_ACCESS_SIGNITUER;

  const refreshSigniture =
    user.role == Roles.user
      ? process.env.USER_REFRESH_SIGNITUER
      : process.env.ADMIN_REFRESH_SIGNITUER;

  const accessToken =
    `${user.role} ` + jwt.sign(payload, accessSigniture, { expiresIn: "3m" });
  const refreshToken =
    `${user.role} ` + jwt.sign(payload, refreshSigniture, { expiresIn: "7d" });
  successHandle({
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
  const user = await decodeToken({
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
    { expiresIn: "3m" }
  );
  successHandle({ res, data: { accessToken }, status: 200 });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new Error("you should send the email", { cause: 404 }));
  }
  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new Error("user Not Found", { cause: 404 }));
  }
  if (!user.confirmed || user.emailOTP.otp) {
    return next(new Error("you should confim your email", { cause: 400 }));
  }
  const passwordOtp = creatOTP();
  user.passwordOTP.otp = passwordOtp;
  user.passwordOTP.expiresIn = Date.now() + 60 * 1000;
  await user.save();
  emailEmitter.emit("forgetPassword", email, passwordOtp);
  successHandle({ res, status: 200 });
};

export const changePassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return next(new Error("invalid inputs", { cause: 404 }));
  }
  const user = await findOne(userModel, { email });
  if (!user || !user.confirmed || user.emailOTP.otp) {
    return next(
      new Error("you should confirm you email first", { cause: 404 })
    );
  }
  if (user.passwordOTP.expiresIn <= Date.now()) {
    return next(new Error("otp expired ... try to resend it", { cause: 400 }));
  }
  const isMatch = user.comparePass(otp, user.passwordOTP.otp);
  if (!isMatch) {
    return next(new Error("invalid otp", { cause: 404 }));
  }
  await updateOne(
    userModel,
    { email },
    {
      credentialChangedAt: Date.now(),
      password: newPassword,
      $unset: {
        passwordOTP: "",
      },
    }
  );
  successHandle({ res, status: 200 });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new Error("invalid inputs", { cause: 404 }));
  }
  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new Error("user not found", { cause: 404 }));
  }
  const otp = creatOTP();
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
    return next(new Error("you already confirmed your email", { cause: 400 }));
  }
  emailEmitter.emit(event, email, otp);
  user[type].otp = otp;
  user[type].expiresIn = Date.now() + 60 * 1000;
  await user.save();
  successHandle({ res, status: 200 });
};

export const socialLogin = async (req, res, next) => {
  const { idToken } = req.body;

  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });

  const { email, name } = ticket.getPayload();
  let user = await userModel.findOne({ email });

  if (!user) {
    user = await create(userModel, {
      email,
      name,
      provider: providers.google,
      confirmed: true,
    });
  }

  const payload = { _id: user._id, email: user.email };

  const accessToken =
    `${user.role} ` +
    jwt.sign(payload, process.env.USER_ACCESS_SIGNITUER, { expiresIn: "3m" });
  const refreshToken =
    `${user.role} ` +
    jwt.sign(payload, process.env.USER_REFRESH_SIGNITUER, { expiresIn: "7d" });
  successHandle({
    res,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
};
