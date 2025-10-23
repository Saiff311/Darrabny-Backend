import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as AV from "./auth.validation.js";
import * as AS from "./auth.service.js";


const authRouter = Router()

authRouter.post("/signup",validation(AV.signupSchema),AS.signUp)
authRouter.patch("/confirmEmail",validation(AV.confirmEmailSchema),AS.confirmEmail)
authRouter.post("/login",validation(AV.loginSchema),AS.login)
authRouter.post("/loginWithGmail",AS.loginWithGmail)
authRouter.get("/refreshToken",validation(AV.refreshTokenSchema),AS.refreshToken)
authRouter.patch("/forgetPassword",validation(AV.forgetPasswordSchema),AS.forgetPassword)
authRouter.patch("/resetPassword",validation(AV.resetPasswordSchema),AS.resetPassword)


export default authRouter