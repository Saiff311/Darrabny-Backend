import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import * as JV from "./internship.validation.js";
import * as JS from "./internship.service.js";
import { fileTypes, hostMulter } from "../../middleware/multer.js";

const internshipRouter = Router();

// Add internship (company only)
internshipRouter.post(
  "/add",
  auth(["company"]),
  hostMulter(fileTypes.image).single("thumbnail"),
  validation(JV.addInternshipSchema),
  JS.addInternship,
);



internshipRouter.get("/my",
    auth([roles.student]),
    JS.getStudentInternships
)

// Update internship
internshipRouter.patch(
  "/:internshipId",
  auth([roles.company, roles.admin]),
  hostMulter(fileTypes.image).single("thumbnail"),

  // ✅ الميدلوير ده بيحول النصوص للأنواع الصح عشان الـ Validation يرضى عنها
  (req, res, next) => {
    // تحويل الـ durationInMonths لرقم (لو مبعوت)
    if (req.body.durationInMonths) {
      req.body.durationInMonths = Number(req.body.durationInMonths);
    }

    // تحويل الـ closed لـ Boolean (لو مبعوت)
    if (req.body.closed !== undefined) {
      req.body.closed = req.body.closed === 'true';
    }

    next();
  },

  validation(JV.updateInternshipSchema),
  JS.updateInternship
);

// Delete internship
internshipRouter.delete(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.deleteInternship,
);

// Get company internships
internshipRouter.get(
  "/companyInternships",
  validation(JV.getCompanyInternshipsSchema),
  auth(Object.values(roles)),
  JS.getCompanyInternships,
);

// Get internship by ID
internshipRouter.get(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.getInternship,
);


// Get filtered internships
internshipRouter.get(
  "/filteredInternships",
  validation(JV.getFilteredInternshipsSchema),
  auth(Object.values(roles)),
  JS.getFilteredInternships,
);

// Apply to internship (with CV upload)
internshipRouter.post(
  "/ApplyToInternship/:internshipId",
  auth([roles.student]),
  hostMulter(fileTypes.pdf).single("resume"),
  validation(JV.ApplyToInternshipSchema),
  JS.ApplyToInternship,
);

// Response to application
internshipRouter.patch(
  "/responseApp/:appId",
  validation(JV.responseAppSchema),
  auth(Object.values(roles)),
  JS.responseApp,
);

export default internshipRouter;