import { Schema, model, Types } from "mongoose";
import { hashPassword, comparePassword } from "../../Utils/bcrypt.js";
import { encrypt, decrypt } from "../../Utils/crypto.js";

export const Roles = { user: "user", admin: "admin" };
export const gender = { mail: "mail", femail: "femail" };
export const providers = { system: "system", google: "google" };
Object.freeze(gender);
Object.freeze(Roles);
Object.freeze(providers);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Please enter your name."],
      minlength: [3, "Your name must be at least 3 characters."],
      maxlength: [15, "Your name can’t be longer than 15 characters."],
    },
    lastName: {
      type: String,
      required: [true, "Please enter your name."],
      minlength: [3, "Your name must be at least 3 characters."],
      maxlength: [15, "Your name can’t be longer than 15 characters."],
    },

    email: {
      type: String,
      required: [true, "Please enter your email address."],
      unique: [true, "This email address is already registered."],
    },

    gender: {
      type: String,
      enum: Object.values(gender),
      default: gender.mail,
    },

    age: {
      type: Number,
      required: [
        function () {
          return this.provider == providers.system ? true : false;
        },
        "Please provide your age.",
      ],
    },

    provider: {
      type: String,
      enum: Object.values(providers),
      default: providers.system,
    },

    password: {
      type: String,
      required: [
        function () {
          return this.provider == providers.system ? true : false;
        },
        "Please create a password.",
      ],
      minlength: [8, "Password must be at least 8 characters long"],
      set(value) {
        return hashPassword(value);
      },
    },

    phone: {
      type: String,
      required: [
        function () {
          return this.provider == providers.system ? true : false;
        },
        "Please enter your phone number.",
      ],
      unique: [true, "This phone number is already in use."],
      set(value) {
        return value ? encrypt(value) : value;
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

    newEmailOTP: {
      otp: {
        type: String,
        set(value) {
          return hashPassword(value);
        },
      },
      expiresIn: Date,
    },

    newEmail: String,
    role: { type: String, enum: Object.values(Roles), default: Roles.user },
    isActive: { type: Boolean, default: true },
    confirmed: { type: Boolean, default: false },
    deletedBy: {
      role: {
        type: String,
        enum: Object.values(Roles),
      },
      id: {
        type: String,
        ref: "users",
      },
    },
    credentialChangedAt: Date,
    oldPasswords: [String],
    profileImage: String,
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
