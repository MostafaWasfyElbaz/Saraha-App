import mongoose from "mongoose";
import chalk from "chalk";
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.URI);
    console.log(chalk.bgGreen.bold.italic(`Connected to MongoDB\n`));
  } catch (error) {
    console.log(chalk.bgRed.bold.italic(error.message));
    process.exit(1);
  }
};

export default connectDB;
