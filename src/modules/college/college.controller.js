import { Router } from "express";
import * as CS from "./college.service.js";
import * as CV from "./college.validation.js";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { hostMulter, fileTypes } from "../../middleware/multer.js";
import { roles } from "../../utils/enums.js";

const collegeRouter = Router();

collegeRouter.post(
  "/signup",
  validation(CV.collegeSignupSchema),
  CS.collegeSignup,
);

collegeRouter.post(
  "/signin",
  validation(CV.collegeSigninSchema),
  CS.collegeSignin,
);

collegeRouter.post(
  "/addCollege",
  hostMulter([...fileTypes.image, fileTypes.pdf]).single("attachment"),
  validation(CV.addCollegeSchema),
  auth(Object.values(roles)),
  CS.addCollege,
);

collegeRouter.put(
  "/updateCollege/:collegeId",
  validation(CV.updateCollegeSchema),
  auth(Object.values(roles)),
  CS.updateCollege,
);

collegeRouter.delete(
  "/softDeleteCollege/:collegeId",
  validation(CV.softDeleteCollegeSchema),
  auth(Object.values(roles)),
  CS.softDeleteCollege,
);

// ------------------ Get All Universities ------------------
collegeRouter.get(
  "/universities",
  auth([roles.company]),
  validation(CV.getAllUniversitiesSchema),
  CS.getAllUniversities,
);

collegeRouter.get(
  "/getCollege/:collegeId",
  validation(CV.getCollegeSchema),
  auth(Object.values(roles)),
  CS.getCollege,
);

collegeRouter.get(
  "/getCollegeByName",
  validation(CV.getCollegeByNameSchema),
  auth(Object.values(roles)),
  CS.getCollegeByName,
);

collegeRouter.patch(
  "/uploadCollegeLogo/:collegeId",
  hostMulter(fileTypes.image).single("attachment"),
  // validation(CV.uploadCollegeLogoSchema),
  auth(Object.values(roles)),
  CS.uploadCollegeLogo,
);

collegeRouter.patch(
  "/UploadCollegeCover/:collegeId",
  hostMulter(fileTypes.image).single("attachment"),
  auth(Object.values(roles)),
  CS.UploadCollegeCover,
);

collegeRouter.delete(
  "/deleteCollegeLogo/:collegeId",
  validation(CV.deleteCollegeLogoSchema),
  auth(Object.values(roles)),
  CS.deleteCollegeLogo,
);

collegeRouter.delete(
  "/deleteCollegeCover/:collegeId",
  validation(CV.deleteCollegeCoverSchema),
  auth(Object.values(roles)),
  CS.deleteCollegeCover,
);

collegeRouter.get(
  "/pending-endorsements",
  auth([roles.college]),
  CS.getPendingEndorsements,
);

collegeRouter.patch(
  "/respondToEndorsementRequest/:requestId",
  validation(CV.respondToEndorsementRequestSchema),
  auth([roles.college]),
  CS.respondToEndorsementRequest,
);

collegeRouter.get(
  "/getCollegeInternsReports",
  auth([roles.college]),
  CS.getCollegeInternsReports,
);

// ========================== Get College Dashboard ==========================
collegeRouter.get(
  "/dashboard",
  auth([roles.college]),
  CS.getCollegeDashboard
);

export default collegeRouter;