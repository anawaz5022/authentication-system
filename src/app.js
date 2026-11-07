import express from "express";
import morgan from "morgan";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import cookieParser from "cookie-parser";


const app = express();


app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());


app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);


export default app; 