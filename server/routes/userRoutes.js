import express from "express";
import { getUserCreations } from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.get("/get-user-creations", auth, getUserCreations);

export default userRouter;
