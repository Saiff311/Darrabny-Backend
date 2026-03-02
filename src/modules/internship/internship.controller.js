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
  validation(JV.addInternshipSchema),
  auth(["company"]),
  JS.addInternship,
);

// Update internship
internshipRouter.patch(
  "/:internshipId",
  validation(JV.updateInternshipSchema),
  auth(Object.values(roles)),
  JS.updateInternship,
);

internshipRouter.get("/my",
    auth([roles.student]),
    JS.getStudentInternships
)

internshipRouter.patch("/:internshipId",
    validation(JV.updateInternshipSchema),
    auth(Object.values(roles)),
    JS.updateInternship
)

// Delete internship
internshipRouter.delete(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.deleteInternship,
);

// Get company internships
internshipRouter.get(
  "/companyInternships/:companyId?",
  validation(JV.getCompanyInternshipsSchema),
  auth(Object.values(roles)),
  JS.getCompanyInternships,
);

// Get internship by ID
internshipRouter.get(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.getInternshipById,
);


// Get filtered internships
internshipRouter.get(
  "/filteredInternships",
  validation(JV.getFilteredInternshipsSchema),
  auth(Object.values(roles)),
  JS.getFilteredInternships,
);

// Get internship applications
internshipRouter.get(
  "/internshipApp",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.getInternshipApp,
);

// Apply to internship (with CV upload)
internshipRouter.post(
  "/ApplyToInternship/:internshipId",
  validation(JV.ApplyToInternshipSchema),
  auth(Object.values(roles)),
  hostMulter(fileTypes.image).single("userCV"),
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