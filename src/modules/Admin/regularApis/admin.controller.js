import { Router } from "express"
import * as AS from "./admin.service.js"
import * as AV from "./admin.validation.js"
import {auth} from "../../../middleware/auth.js"
import { roles } from "../../../utils/enums.js"
import { validation } from "../../../middleware/validation.js"


const adminRouter = Router()

// ------------------ Verify Company ------------------
adminRouter.patch("/companies/:id/verify",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.verifyCompany)

adminRouter.patch("/ban-unBan-user/:id",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.banUser)

adminRouter.patch("/ban-unBan-company/:id",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.banCompany)


export default adminRouter
