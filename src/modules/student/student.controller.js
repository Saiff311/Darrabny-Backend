import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as US from "./student.service.js";
import * as UV from "./student.validation.js";
import {auth} from "../../middleware/auth.js"
import {hostMulter, fileTypes} from "../../middleware/multer.js"
import { roles } from "../../utils/enums.js";


const StudentRouter = Router()

StudentRouter.patch("/UpdateStudentAccount",
    validation(UV.UpdateStudentAccountSchema),
    auth([roles.student]),
    US.UpdateStudentAccount)

StudentRouter.get("/getLoginStudent",
    auth([roles.student]),
    US.getLoginStudent)


StudentRouter.get("/getAnotherUser/:id",
    validation(UV.getAnotherUserSchema),
    auth(Object.values(roles)),
    US.getAnotherUser)

StudentRouter.patch("/updatePassword",
    validation(UV.updatePasswordSchema),
    auth(Object.values(roles)),
    US.updatePassword)    

StudentRouter.patch("/UploadProfilePic",
    hostMulter(fileTypes.image).single("attachment"),
    auth(Object.values(roles)),
    US.UploadProfilePic)

StudentRouter.patch("/UploadCoverPic",
    hostMulter(fileTypes.image).single("attachment"),
    auth(Object.values(roles)),
    US.UploadCoverPic)

StudentRouter.delete("/deleteProfilePic",
    auth(Object.values(roles)),
    US.deleteProfilePic)

StudentRouter.delete("/deleteCoverPic",
    auth(Object.values(roles)),
    US.deleteCoverPic)

StudentRouter.delete("/softDelete",
    auth(Object.values(roles)),
    US.softDelete)

export default StudentRouter