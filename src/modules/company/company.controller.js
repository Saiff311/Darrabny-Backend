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



// ------------------ Send Endorsement Request ------------------
companyRouter.post(
  "/endorsement-request",
  auth([roles.company]),
  validation(CV.sendEndorsementRequestSchema),
  CS.sendEndorsementRequest,
);

// ------------------ Get Company Applications ------------------
companyRouter.get(
  "/applications",
  auth([roles.company]),
  validation(CV.getCompanyApplicationsSchema, "query"),
  CS.getCompanyApplications
);

// ------------------ Display Company Verification ------------------
companyRouter.get(
  "/verification",
  auth([roles.company]),
  validation(CV.emptySchema),
  CS.companyVerification
);

// ------------------ Upload Verification Document ------------------
companyRouter.post(
  "/verification/documents",
  auth([roles.company]),
  hostMulter([...fileTypes.image, ...fileTypes.pdf]).single("document"),
  validation(CV.uploadVerificationDocumentSchema),
  CS.uploadVerificationDocument,
);

// ------------------ Delete Verification Document ------------------
companyRouter.delete(
  "/verification/documents/:docId",
  auth([roles.company]),
  validation(CV.deleteVerificationDocumentSchema),
  CS.deleteVerificationDocument,
);

// ------------------ Get Company Dashboard (not completed) ------------------
companyRouter.get(
  "/dashboard",
  auth([roles.company]),
  validation(CV.emptySchema),
  CS.getCompanyDashboard
);

// ------------------ Company Settings ------------------
companyRouter.get(
  "/settings",
  auth([roles.company]),
  validation(CV.emptySchema),
  CS.getCompanySettings,
);

// ------------------ Update Company Settings ------------------
companyRouter.patch(
  "/settings",
  auth([roles.company]),
  validation(CV.updateCompanySettingsSchema),
  CS.updateCompanySettings,
);

// ------------------ Update Company Notification Preferences ------------------
companyRouter.patch(
  "/settings/notifications",
  auth([roles.company]),
  validation(CV.updateNotificationPreferencesSchema),
  CS.updateNotificationPreferences,
);

// ------------------ Search Companies ------------------
companyRouter.get(
  "/search",
  validation(CV.searchCompaniesSchema, "query"),
  CS.searchCompanies,
);

// ------------------ Get Featured Companies ------------------
companyRouter.get(
  "/featured",
  CS.getFeaturedCompanies
);

// ------------------ Get All Companies ------------------
companyRouter.get(
  "/allCompanies",
  validation(CV.getAllCompaniesSchema, "query"),
  CS.getAllCompanies,
);

// ------------------ Get Company Internships ------------------
companyRouter.get(
  "/:companyId/internships",
  validation(CV.getCompanyInternshipsSchema),
  CS.getCompanyInternships,
);

// ------------------ Add Company Review ------------------
companyRouter.post(
  "/:companyId/reviews",
  auth([roles.student]),
  validation(CV.addCompanyReviewSchema),
  CS.addCompanyReview
);

// ------------------ Get Company Reviews ------------------
companyRouter.get(
  "/:companyId/reviews",
  validation(CV.getCompanyReviewsSchema),
  CS.getCompanyReviews
);

// ========================= Get My Company Profile =========================
companyRouter.get(
  "/me",
  auth([roles.company]),
  validation(CV.getMyCompanySchema),
  CS.getMyCompanyProfile,
);

// ========================= Update My Company Profile =========================
companyRouter.patch(
  "/me",
  auth([roles.company]),
  validation(CV.updateMyCompanySchema),
  CS.updateMyCompanyProfile,
);

// ========================= Completed Internships Overview =========================
companyRouter.get(
  "/completed-overview",
  auth([roles.company]),
  validation(CV.emptySchema),
  CS.getCompletedInternshipsOverview,
);

export default companyRouter;
