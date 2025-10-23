import { Router } from "express"
import * as CS from "./company.service.js"
import * as CV from "./company.validation.js"
import { validation } from "../../middleware/validation.js";
import {auth} from "../../middleware/auth.js"
import {hostMulter, fileTypes} from "../../middleware/multer.js"
import { roles } from "../../utils/enums.js";
import internshipRouter from "../internship/internship.controller.js";

const companyRouter = Router()


companyRouter.post("/addCompany",
    hostMulter([...fileTypes.image, fileTypes.pdf]).single("attachment"),
    validation(CV.addCompanySchema),
    auth(Object.values(roles)),
    CS.addCompany)

companyRouter.put("/updateCompany/:companyId",
    validation(CV.updateCompanySchema),
    auth(Object.values(roles)),
    CS.updateCompany)

companyRouter.delete("/softDeleteCompany/:companyId",
    validation(CV.softDeleteCompanySchema),
    auth(Object.values(roles)),
    CS.softDeleteCompany)

companyRouter.get("/getCompany/:companyId",
    validation(CV.getCompanySchema),
    auth(Object.values(roles)),
    CS.getCompany)

companyRouter.get("/getCompanyByName",
    validation(CV.getCompanyByNameSchema),
    auth(Object.values(roles)),
    CS.getCompanyByName)

companyRouter.patch("/uploadCompanyLogo/:companyId",
    hostMulter(fileTypes.image).single("attachment"),
    // validation(CV.uploadCompanyLogoSchema),
    auth(Object.values(roles)),
    CS.uploadCompanyLogo)

companyRouter.patch("/UploadCompanyCover/:companyId",
    hostMulter(fileTypes.image).single("attachment"),
    auth(Object.values(roles)),
    CS.UploadCompanyCover)

companyRouter.delete("/deleteCompanyLogo/:companyId",
    validation(CV.deleteCompanyLogoSchema),
    auth(Object.values(roles)),
    CS.deleteCompanyLogo)

companyRouter.delete("/deleteCompanyCover/:companyId",
    validation(CV.deleteCompanyCoverSchema),
    auth(Object.values(roles)),
    CS.deleteCompanyCover)

export default companyRouter