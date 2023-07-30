import mongoose from "mongoose";
import User from "../models/UserModel.js";

/* url */
const dbName = "mini-library";
const uri = `mongodb://127.0.0.1:27017/${dbName}`;

/* connect */
mongoose.connect(uri);
