import { Router } from "express"
import * as AS from "./admin.service.js"
import * as AV from "./admin.validation.js"
import {auth} from "../../../middleware/auth.js"
import { roles } from "../../../utils/enums.js"
import { validation } from "../../../middleware/validation.js"


const adminRouter = Router()

adminRouter.patch("/ban-unBan-user/:id",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.banUser)

adminRouter.patch("/ban-unBan-company/:id",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.banCompany)

adminRouter.patch("/approveCompany/:id",
   validation(AV.idSchema),
    auth([roles.admin]) ,
    AS.approveCompany)


export default adminRouter
