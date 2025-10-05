import express from "express";
import cors from "cors";
import connectDb from "./src/config/db.config.js";
import userRoute from "./src/apis/users/user.route.js";

import dotenv from "dotenv";
dotenv.config();

connectDb();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors()); // allow all origins during development

// Expose both legacy and new API base paths
app.use("/user", userRoute);
app.use("/api/user", userRoute);

app.listen(port, () => console.log(`Server running http://localhost:${port}`));
