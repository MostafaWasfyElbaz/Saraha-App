import { Schema, model } from "mongoose";
import { hashPassword, comparePassword } from "../../Utils/bcrypt.js";
import { encrypt, decrypt } from "../../Utils/crypto.js";

export const Roles = { user: "user", admin: "admin" };
const gender = { mail: "mail", femail: "femail" };
export const secureType = { password: "password", otp: "otp" };
Object.freeze(gender);
Object.freeze(secureType);
Object.freeze(Roles);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [15, "Name must be at most 15 characters long"],
    },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      set(value) {
        return hashPassword(value);
      },
    },
    gender: {
      type: String,
      enum: Object.values(gender),
      default: gender.mail,
    },
    age: { type: Number, required: [true, "age required"] },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: [true, "Phone number must be unique"],
      set(value) {
        return encrypt(value);
      },
      get(value) {
        return decrypt(value);
      },
    },
    role: { type: String, enum: Object.values(Roles), default: Roles.user },
    confirmed: { type: Boolean, default: false },
    credentialChangedAt: {
      type: Date,
    },
    emailOTP: {
      type: String,
      set(value) {
        return hashPassword(value);
      },
    },
    passwordOTP: {
      type: String,
      set(value) {
        return hashPassword(value);
      },
    },
  },
  {
    methods: {
      comparePass(password, hash) {
        return comparePassword(password, hash);
      },
    },
    timestamps: true,
    toJSON: {
      setters: true,
      getters: true,
    },
    toObject: {
      setters: true,
      getters: true,
    },
  }
);

export const userModel = model("users", userSchema);
