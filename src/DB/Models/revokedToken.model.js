import { Schema, model, Types } from "mongoose";

const revokedTokenSchema = new Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
    },
    expireIn: {
      type: Date,
      required: true,
    },
    user: {
      type: Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const revokedTokenModel = model("revokedTokens", revokedTokenSchema);