import connectDB from "./DB/connection.js";
import authController from "./Modules/authModule/auth.controller.js";
import userController from "./Modules/userModule/user.controller.js";
import messageController from "./Modules/messageModule/message.controller.js";
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan";

const bootStrap = async (app, express) => {
  app.use(cors());
  await connectDB();
  app.use(express.json());
  app.use(morgan("combined"));
  app.use("/src/uploads", express.static("./src/uploads"));
  app.use("/auth", authController);
  app.use("/user", userController);
  app.use("/message", messageController);

  app.use((err, req, res, next) => {
    res.status(err.cause || 500).json({
      message: err.message || "internal server error",
      cause: err.cause || 500,
      stack: err.stack,
    });
  });
  try {
    app.listen(process.env.PORT, () => {
      console.log(chalk.bgGreen.bold.italic(`Server is running\n`));
    });
  } catch (error) {
    console.log(chalk.bgRed.bold.italic(error.message));
  }
};
export default bootStrap;
