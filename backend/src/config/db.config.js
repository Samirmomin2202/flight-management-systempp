import mongoose from "mongoose";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const URI = process.env.MONGO_URI;

const connectDb = async () => {
  try {
    await mongoose.connect(URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(chalk.cyan("Connected to MongoDB Atlas successfully"));
  } catch (err) {
    console.error(chalk.red("MongoDB connection error:"), err);
    process.exit(1);
  }
};

export default connectDb;
