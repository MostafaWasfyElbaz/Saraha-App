import { Schema, model } from "mongoose";
import { hashPassword, comparePassword } from "../../Utils/bcrypt.js";
import { encrypt, decrypt } from "../../Utils/crypto.js";

export const Roles = { user: "user", admin: "admin" };
const gender = { mail: "mail", femail: "femail" };
export const providers = { system: "system", google: "google" };
Object.freeze(gender);
Object.freeze(Roles);
Object.freeze(providers);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [15, "Name must be at most 15 characters long"],
    },

    email: {
      type: String,
      required: [true, "NaEmailme is required"],
      unique: [true, "Email must be unique"],
    },

    gender: {
      type: String,
      enum: Object.values(gender),
      default: gender.mail,
    },

    age: {
      type: Number,
      required: function () {
        return this.provider == providers.system ? true : false;
      },
    },

    provider: {
      type: String,
      enum: Object.values(providers),
      default: providers.system,
    },

    password: {
      type: String,
      required: function () {
        return this.provider == providers.system ? true : false;
      },
      minlength: [8, "Password must be at least 8 characters long"],
      set(value) {
        return hashPassword(value);
      },
    },

    phone: {
      type: String,
      required: function () {
        return this.provider == providers.system ? true : false;
      },
      unique: [true, "Phone number must be unique"],
      set(value) {
        return encrypt(value);
      },
      get(value) {
        return value ? decrypt(value) : value;
      },
    },

    emailOTP: {
      otp: {
        type: String,
        set(value) {
          return hashPassword(value);
        },
      },
      expiresIn: Date,
    },

    passwordOTP: {
      otp: {
        type: String,
        set(value) {
          return hashPassword(value);
        },
      },
      expiresIn: Date,
    },

    role: { type: String, enum: Object.values(Roles), default: Roles.user },

    confirmed: { type: Boolean, default: false },

    credentialChangedAt: Date,
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
