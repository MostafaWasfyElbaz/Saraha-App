import { EventEmitter } from "events";
import { sendEmail } from "./sendEmail.js";
import { customAlphabet } from "nanoid";
export const creatOTP = () => {
  return customAlphabet(
    process.env.OTP_ALPAHBET,
    Number(process.env.OTP_SIZE)
  )();
};
export const emailEmitter = new EventEmitter();

emailEmitter.on("forgetPassword", async (email, otp) => {
  const html = `<p>you can now change your password: ${otp}</p`;
  const subject = "Forget Password";
  await sendEmail(email, subject, html);
});

emailEmitter.on("confirmEmail", async (email, otp) => {
  const html = `<p>Thank you for signing up! Please confirm your email address: ${otp}</p`;
  const subject = "Email Confirmation";
  await sendEmail(email, subject, html);
});
