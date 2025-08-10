import connectDB from "./DB/connection.js";
import authController from "./Modules/authModule/auth.controller.js";
import userController from "./Modules/userModule/user.controller.js";
import cors from "cors";

const bootStrap = async (app, express) => {
  app.use(cors());
  await connectDB();
  app.use(express.json());

  app.use("/uploads", express.static("uploads"));
  app.use("/auth", authController);
  app.use("/user", userController);

  app.use((err, req, res, next) => {
    res.status(err.cause || 500).json({
      message: err.message || "internal server error",
      cause: err.cause || 500,
      stack: err.stack,
    });
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server is running`);
  });
};
export default bootStrap;
