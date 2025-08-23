import { Schema, model } from "mongoose";

export const messageSchema = new Schema(
  {
    body: {
      type: String,
      required: function () {
        if (this.images.length > 0) {
          return false;
        }
        return true;
      },
    },
    images: [
      {
        public_id: String,
        secure_url: String,
      },
    ],
    from: {
      type: Schema.Types.ObjectId,
      ref: "users",
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

export const messageModel = model("messages", messageSchema);
