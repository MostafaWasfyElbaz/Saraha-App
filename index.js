import dotenv from "dotenv";
dotenv.config({ path: "./src/config/.env" });
import express from "express";
import bootStrap from "./src/app.controller.js";
const app = express();

bootStrap(app, express);
