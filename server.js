import express from "express";
import routes from "./routes/index.js";
import ErrorHandler from "./helpers/ErrorHandler.js";
import ErrorMiddleware from "./middlewares/Error.js";
import { envVariables } from "./config/constants.js";
import cors from "cors";
import mongoose from "mongoose";

const { mongoDbURI, appPort, frontendUrl } = envVariables;
const app = express();

const allowedUrls = ["https://github.com", frontendUrl];

app.use(express.json());
app.use(
  cors({
    origin: allowedUrls,
    credentials: true,
  })
);

mongoose
  .connect(mongoDbURI)
  .then(() => {
    console.log("database connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/v1", routes);
app.use((req, res, next) => {
  console.log("REq ===>", req?.url);
  next(new ErrorHandler("Route not found", 404));
});

app.use(ErrorMiddleware);

app.listen(appPort, () => {
  console.log(`Listening to port ${appPort}`);
});
