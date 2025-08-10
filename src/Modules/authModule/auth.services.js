import { Roles, userModel, providers } from "../../DB/Models/userModel.js";
import { findOne, create, updateOne } from "../../DB/DBservices.js";
import { successHandler } from "../../Utils/successHandler.js";
import {
  emailEmitter,
  createOTP,
} from "../../Utils/ConfirmEmail/emailEmitter.js";
import jwt from "jsonwebtoken";
import { decodeToken, types } from "../../Middelware/auth.middleware.js";
import { OAuth2Client } from "google-auth-library";
import {
  missingFields,
  notFoundUser,
  expiredCode,
  invalidCredentials,
  emailAlreadyConfirmed,
  existEmail,
  emailNotConfirmed,
  userIsNotActive
} from "../../Utils/errors.js";
const client = new OAuth2Client();

export const signup = async (req, res, next) => {
  const { firstName, lastName, role, email, password, phone, age, gender } = req.body;
  if (!firstName || !lastName || !email || !password || !phone || !age) {
    return next(new missingFields());
  }
  const user = await findOne(userModel, { email });
  if (user) {
    return next(new existEmail());
  }
  const confirmOtp = createOTP();
  const newUser = await create(userModel, {
    firstName,
    lastName,
    email,
    phone,
    password,
    emailOTP: {
      otp: confirmOtp,
      expiresIn: Date.now() + Number(process.env.EXPIRATION),
    },
    age,
    gender,
    role,
  });

  emailEmitter.emit("confirmEmail", email, confirmOtp);

  return successHandler({ res, status: 201, data: newUser });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new missingFields());
  }

  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new notFoundUser());
  }
  if (user.emailOTP.expiresIn <= Date.now()) {
    return next(new expiredCode());
  }
  if (!user.emailOTP.otp || !user.confirmed) {
    return next(new emailAlreadyConfirmed());
  }
  const isMatch = await user.comparePass(otp, user.emailOTP.otp);
  if (!isMatch) {
    return next(new invalidCredentials());
  }
  await updateOne(
    userModel,
    { email },
    { confirmed: true, $unset: { emailOTP: "" } }
  );
  return successHandler({ res, status: 200 });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new missingFields());
  }
  const user = await findOne(userModel, { email });

  if (!user) {
    return next(new notFoundUser());
  }
  if (user.provider != providers.system) {
    return next(new Error("you can't login with system login", { cause: 400 }));
  }
  if (!user.confirmed) {
    return next(new emailNotConfirmed());
  }
  const isMatch = await user.comparePass(password, user.password);
  if (!isMatch) {
    return next(new invalidCredentials());
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
    `${user.role} ` +
    jwt.sign(payload, accessSigniture, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    });
  const refreshToken =
    `${user.role} ` +
    jwt.sign(payload, refreshSigniture, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
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
    return next(new missingFields());
  }
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
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION }
  );
  successHandler({
    res,
    data: { accessToken: `${user.role} ${accessToken}` },
    status: 200,
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new missingFields());
  }
  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new notFoundUser());
  }
  if (!user.confirmed || user.emailOTP.otp) {
    return next(new emailNotConfirmed());
  }
  const passwordOtp = createOTP();
  user.passwordOTP.otp = passwordOtp;
  user.passwordOTP.expiresIn = Date.now() + Number(process.env.EXPIRATION);
  await user.save();
  emailEmitter.emit("forgetPassword", email, passwordOtp);
  successHandler({ res, status: 200 });
};

export const changePassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return next(new missingFields());
  }
  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new notFoundUser());
  }
  if (!user.confirmed || user.emailOTP.otp) {
    return next(new emailNotConfirmed());
  }
  if (user.passwordOTP.expiresIn <= Date.now()) {
    return next(new expiredCode());
  }
  const isMatch = user.comparePass(otp, user.passwordOTP.otp);
  if (!isMatch) {
    return next(new invalidCredentials());
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
  successHandler({ res, status: 200 });
};

export const resendOtp = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new missingFields());
  }
  const user = await findOne(userModel, { email });
  if (!user) {
    return next(new notFoundUser());
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
    return next(new emailAlreadyConfirmed());
  }
  emailEmitter.emit(event, email, otp);
  user[type].otp = otp;
  user[type].expiresIn = Date.now() + Number(process.env.EXPIRATION);
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
    return next(new emailNotConfirmed());
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
    return next(new emailNotConfirmed());
  }
  if (!newEmail) {
    return next(new missingFields());
  }
  const isExist = await findOne(userModel, { email: newEmail });
  if (isExist || user.email == newEmail) {
    return next(new existEmail());
  }
  const oldEmailConfirmOtp = createOTP();
  const newEmailConfirmOtp = createOTP();
  await updateOne(
    userModel,
    { _id: user._id },
    {
      newEmail,
      newEmailOTP: {
        otp: newEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.EXPIRATION),
      },
      emailOTP: {
        otp: oldEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.EXPIRATION),
      },
    }
  );
  emailEmitter.emit("confirmEmail", user.email, oldEmailConfirmOtp);
  emailEmitter.emit("confirmEmail", newEmail, newEmailConfirmOtp);
  successHandler({ res, status: 200 });
};

export const confirmNewEmail = async (req, res, next) => {
  const user = req.user;
  const { otp, newOtp } = req.body;
  if (!otp || !newOtp) {
    return next(new missingFields());
  }
  if (
    user.emailOTP.expiresIn <= Date.now() ||
    user.newEmailOTP.expiresIn <= Date.now()
  ) {
    return next(new expiredCode());
  }
  if (!user.emailOTP.otp || !user.newEmailOTP.otp) {
    return next(new emailAlreadyConfirmed());
  }
  console.log(otp, user.emailOTP.otp);
  console.log(newOtp, user.newEmailOTP.otp);
  if (
    !(await user.comparePass(otp, user.emailOTP.otp)) ||
    !(await user.comparePass(newOtp, user.newEmailOTP.otp))
  ) {
    return next(new invalidCredentials());
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

export const resendConfirmEmailCode = async (req, res, next) => {
  const user = req.user;
  const oldEmailConfirmOtp = createOTP();
  const newEmailConfirmOtp = createOTP();
  await updateOne(
    userModel,
    { _id: user._id },
    {
      newEmailOTP: {
        otp: newEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.EXPIRATION),
      },
      emailOTP: {
        otp: oldEmailConfirmOtp,
        expiresIn: Date.now() + Number(process.env.EXPIRATION),
      },
    }
  );
  emailEmitter.emit("confirmEmail", user.email, oldEmailConfirmOtp);
  emailEmitter.emit("confirmEmail", user.newEmail, newEmailConfirmOtp);
  successHandler({ res, status: 200 });
};

export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  const user = req.user;
  if (!user.confirmed) {
    return next(new emailNotConfirmed());
  }
  if (!oldPassword || !newPassword) {
    return next(new missingFields());
  }
  if(!user.isActive){
    return next(new userIsNotActive());
  }
  if (oldPassword == newPassword) {
    return next(new invalidCredentials());
  }
  if (!(await user.comparePass(oldPassword, user.password))) {
    return next(new invalidCredentials());
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
