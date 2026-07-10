import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { upload } from "../middlewares/multer.js"
import { generateCoverLetter } from "../controllers/coverLetter.controller.js"

const coverLetterRouter = express.Router()

coverLetterRouter.post("/generate", isAuth, upload.single("resume"), generateCoverLetter)

export default coverLetterRouter;