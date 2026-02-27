import { Router } from "express";
import * as CS from "./company.service.js";
import * as CV from "./company.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { hostMulter, fileTypes } from "../../middleware/multer.js";
import { roles } from "../../utils/enums.js";

const companyRouter = Router();

// ------------------ Add Company ------------------
companyRouter.post(
  "/addCompany",
  hostMulter([...fileTypes.image, fileTypes.pdf]).single("attachment"),
  validation(CV.addCompanySchema),
  auth(Object.values(roles)),
  CS.addCompany,
);

// ------------------ Update Company ------------------
companyRouter.put(
  "/updateCompany/:companyId",
  validation(CV.updateCompanySchema),
  auth(Object.values(roles)),
  CS.updateCompany,
);

// ------------------ Soft Delete Company ------------------
companyRouter.delete(
  "/softDeleteCompany/:companyId",
  validation(CV.softDeleteCompanySchema),
  auth(Object.values(roles)),
  CS.softDeleteCompany,
);

// ------------------ Get Company by ID ------------------
companyRouter.get(
  "/getCompany/:companyId",
  validation(CV.getCompanySchema),
  auth(Object.values(roles)),
  CS.getCompany,
);

// ------------------ Get Company by Name ------------------
companyRouter.get(
  "/getCompanyByName",
  validation(CV.getCompanyByNameSchema),
  auth(Object.values(roles)),
  CS.getCompanyByName,
);

// ------------------ Upload Company Logo ------------------
companyRouter.patch(
  "/uploadCompanyLogo/:companyId",
  hostMulter(fileTypes.image).single("attachment"),
  // validation(CV.uploadCompanyLogoSchema), // optional
  auth(Object.values(roles)),
  CS.uploadCompanyLogo,
);

// ------------------ Upload Company Cover ------------------
companyRouter.patch(
  "/UploadCompanyCover/:companyId",
  hostMulter(fileTypes.image).single("attachment"),
  auth(Object.values(roles)),
  CS.UploadCompanyCover,
);

// ------------------ Delete Company Logo ------------------
companyRouter.delete(
  "/deleteCompanyLogo/:companyId",
  validation(CV.deleteCompanyLogoSchema),
  auth(Object.values(roles)),
  CS.deleteCompanyLogo,
);

// ------------------ Delete Company Cover ------------------
companyRouter.delete(
  "/deleteCompanyCover/:companyId",
  validation(CV.deleteCompanyCoverSchema),
  auth(Object.values(roles)),
  CS.deleteCompanyCover,
);

// ------------------ Company Signup ------------------
companyRouter.post(
  "/signup",
  hostMulter([...fileTypes.image, fileTypes.pdf]).single("legalAttachment"),
  validation(CV.companySignupSchema),
  CS.companySignup,
);

// ------------------ Company Login ------------------
companyRouter.post(
  "/login",
  validation(CV.companyLoginSchema),
  CS.companyLogin,
);

// ------------------ Get Company Applications ------------------
companyRouter.get(
  "/applications",
  auth([roles.company]),
  validation(CV.getCompanyApplicationsSchema, "query"),
  CS.getCompanyApplications
);
export default companyRouter;
