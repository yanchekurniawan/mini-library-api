import express from "express";
import cors from "cors";
import routes from "./routes/Routes.js";
import env from "dotenv";
import cookieParser from "cookie-parser";

const app = express();

/* DB Config */
import "./config/Database.js";

/* dotenv donfig */
env.config();

/* Middleware */
app.use(express.json({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:3000",
  })
);
/* Cookie Parser */
app.use(cookieParser());
/* Routing Middleware */
app.use(routes);

/* Run Server */
const port = 5000;
const host = "localhost";
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
