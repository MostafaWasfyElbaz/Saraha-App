import { findById } from "../../DB/DBservices.js";
import { userModel } from "../../DB/Models/userModel.js";
import * as errorRes from "../../Utils/errors.js";
import { uploadMultipleFiles } from "../../Utils/multer/cloudinary.services.js";
import { create } from "../../DB/DBservices.js";
import { messageModel } from "../../DB/Models/message.model.js";
import { successHandler } from "../../Utils/successHandler.js";

export const sendMessage = async (req, res, next) => {
  const { body, from, to } = req.body;
  if (from) {
    if (from == to) {
      return next(
        new Error("you can't send message to yourself", { cause: 400 })
      );
    }
    const sender = await findById(userModel, { _id: from });
    if (!sender) {
      return next(new errorRes.notFoundUser());
    }
  }
  const reciver = to ? await findById(userModel, { _id: to }) : null;
  if (!reciver) {
    return next(new errorRes.notFoundUser());
  }
  let images = [];
  if (req.files?.length > 0) {
    const paths = [];
    for (const image of req.files) {
      paths.push(image.path);
    }

    images = await uploadMultipleFiles({
      paths,
      dest: `messages/${reciver._id}`,
    });
  }
  const message = await create(messageModel, {
    body,
    from,
    to,
    images,
  });
  successHandler({ res, data: message, status: 200 });
};

export const getUserMessages = async (req, res, next) => {
  const userId = req.params.id;
  const messages = await userModel
    .findById({ _id: userId })
    .select("name")
    .populate([
      {
        path: "messages",
        select: "from body images -to",
        populate: [
          {
            path: "from",
            select: "name",
          },
        ],
      },
    ]);
  successHandler({ res, data: messages, status: 200 });
};
