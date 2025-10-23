import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import {auth} from "../../middleware/auth.js"
import {hostMulter, fileTypes} from "../../middleware/multer.js"
import { roles } from "../../utils/enums.js";


const userRouter = Router()

userRouter.patch("/UpdateAccount",
    validation(UV.UpdateAccountSchema),
    auth(Object.values(roles)),
    US.UpdateAccount)

userRouter.get("/getLoginUser",
    auth(Object.values(roles)),
    US.getLoginUser)

userRouter.get("/getAnotherUser/:id",
    validation(UV.getAnotherUserSchema),
    auth(Object.values(roles)),
    US.getAnotherUser)

userRouter.patch("/updatePassword",
    validation(UV.updatePasswordSchema),
    auth(Object.values(roles)),
    US.updatePassword)    

userRouter.patch("/UploadProfilePic",
    hostMulter(fileTypes.image).single("attachment"),
    auth(Object.values(roles)),
    US.UploadProfilePic)

userRouter.patch("/UploadCoverPic",
    hostMulter(fileTypes.image).single("attachment"),
    auth(Object.values(roles)),
    US.UploadCoverPic)

userRouter.delete("/deleteProfilePic",
    auth(Object.values(roles)),
    US.deleteProfilePic)

userRouter.delete("/deleteCoverPic",
    auth(Object.values(roles)),
    US.deleteCoverPic)

userRouter.delete("/softDelete",
    auth(Object.values(roles)),
    US.softDelete)

export default userRouter