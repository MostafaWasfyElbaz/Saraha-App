import { EventEmitter } from "events";
import { sendEmail } from "./sendEmail.js";
import { customAlphabet } from "nanoid";
import { template } from "./generateHTML.js";

export const createOTP = () => {
  return customAlphabet(
    process.env.OTP_ALPAHBET,
    Number(process.env.OTP_SIZE)
  )();
};
export const emailEmitter = new EventEmitter();

emailEmitter.on("forgetPassword", async (email, otp, name) => {
  const subject = "Forget Password";
  const message = template(otp, name, subject);
  await sendEmail(email, subject, message);
});

emailEmitter.on("confirmEmail", async (email, otp, name) => {
  const subject = "Confirm Email";
  const message = template(otp, name, subject);
  await sendEmail(email, subject, message);
});
