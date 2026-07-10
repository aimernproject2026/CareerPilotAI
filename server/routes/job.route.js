import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { findJobs } from "../controllers/job.controller.js"

const jobRouter = express.Router()

jobRouter.post("/find", isAuth, upload.single("resume"), findJobs)

export default jobRouter;