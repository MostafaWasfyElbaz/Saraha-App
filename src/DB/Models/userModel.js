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
    name: {
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
      attempts: Number,
      banExpiry: Date,
    },

    passwordOTP: {
      otp: {
        type: String,
        set(value) {
          return hashPassword(value);
        },
      },
      expiresIn: Date,
      attempts: Number,
      banExpiry: Date,
    },

    newEmailOTP: {
      otp: {
        type: String,
        set(value) {
          return hashPassword(value);
        },
      },
      expiresIn: Date,
      attempts: Number,
      banExpiry: Date,
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
    localProfileImage: String,
    cloudProfileImage: {
      public_id: String,
      secure_url: String,
    },
    cloudCoverImage: [
      {
        public_id: String,
        secure_url: String,
      },
    ],
    Requests: { codeRequest: Number, banExpiry: Date },
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

userSchema.virtual("messages", {
  localField: "_id",
  foreignField: "to",
  ref: "messages",
});

export const userModel = model("users", userSchema);
