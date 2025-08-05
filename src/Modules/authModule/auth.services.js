import { Roles, secureType, userModel } from "../../DB/Models/userModel.js";
import { findOne, create, updateOne } from "../../DB/DBservices.js";
import { successHandle } from "../../Utils/successHandles.js";
import {
  emailEmitter,
  creatOTP,
} from "../../Utils/ConfirmEmail/emailEmitter.js";
import jwt from "jsonwebtoken";
import { decodeToken, types } from "../../Middelware/auth.middleware.js";

export const signup = async (req, res, next) => {
  const { name, email, password, phone, age, gender = "mail" } = req.body;
  if (!name || !email || !password || !phone || !age) {
    return next(new Error("All fields are required", { cause: 400 }));
  }
  const user = await findOne(userModel, { email });
  if (user) {
    return next(new Error("Email already exists", { cause: 404 }));
  }
  const emailOTP = creatOTP();
  const newUser = await create(userModel, {
    name,
    email,
    phone,
    password,
    emailOTP,
    age,
    gender,
  });

  emailEmitter.emit("confirmEmail", email, emailOTP);

  return successHandle({ res, status: 201, data: newUser });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new Error("Email and OTP are required", { cause: 400 }));
  }

  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  if (!user.emailOTP || !user.comparePass(otp, user.emailOTP)) {
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
  if (!user.confirmed || user.emailOTP) {
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
  if (!user.confirmed || user.emailOTP) {
    return next(new Error("you should confim your email", { cause: 400 }));
  }
  const passwordOTP = creatOTP();
  user.passwordOTP = passwordOTP;
  console.log(user);
  await user.save();
  emailEmitter.emit("forgetPassword", email, passwordOTP);
  successHandle({ res, status: 200 });
};

export const changePassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return next(new Error("invalid inputs", { cause: 404 }));
  }
  const user = await findOne(userModel, { email });
  if (!user || !user.confirmed || user.emailOTP) {
    return next(
      new Error("you should confirm you email first", { cause: 404 })
    );
  }
  if (!user.comparePass(otp, user.passwordOTP)) {
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
