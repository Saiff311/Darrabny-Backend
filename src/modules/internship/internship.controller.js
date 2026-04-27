import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import * as JV from "./internship.validation.js";
import * as JS from "./internship.service.js";
import { fileTypes, hostMulter } from "../../middleware/multer.js";

const internshipRouter = Router();

// ─────────────────────────────────────────────
// LANDING ROUTES (no auth required)
// ─────────────────────────────────────────────

// GET /api/internship/search-preview?q=frontend
internshipRouter.get(
  "/search-preview",
  validation(JV.searchPreviewSchema),
  JS.searchPreview
);

// GET /api/internship/featured
internshipRouter.get(
  "/featured",
  JS.getFeaturedInternships
);

// ─────────────────────────────────────────────
// LISTING ROUTES
// ─────────────────────────────────────────────

// GET /api/internship?q=...&internshipLocation=...&technicalSkills=react,node&...
internshipRouter.get(
  "/",
  validation(JV.searchInternshipsSchema),
  JS.searchInternships
);

// GET /api/internship/recommended  (auth required — student only)
internshipRouter.get(
  "/recommended",
  auth([roles.student]),
  JS.getRecommendedInternships
);

// ─────────────────────────────────────────────
// COMPANY ROUTES
// ─────────────────────────────────────────────

// POST /api/internship/add
internshipRouter.post(
  "/add",
  auth(["company"]),
  hostMulter(fileTypes.image).single("thumbnail"),
  validation(JV.addInternshipSchema),
  JS.addInternship
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
// GET /api/internship/companyInternships
internshipRouter.get(
  "/companyInternships",
  validation(JV.getCompanyInternshipsSchema),
  auth(Object.values(roles)),
  JS.getCompanyInternships
);

// ─────────────────────────────────────────────
// STUDENT ROUTES
// ─────────────────────────────────────────────

// GET /api/internship/my
internshipRouter.get(
  "/my",
  auth([roles.student]),
  JS.getStudentInternships
);


// Get filtered internships
internshipRouter.get(
  "/filteredInternships",
  validation(JV.getFilteredInternshipsSchema),
  auth(Object.values(roles)),
  JS.getFilteredInternships,
);

// Apply to internship (with CV upload)
// POST /api/internship/ApplyToInternship/:internshipId
internshipRouter.post(
  "/ApplyToInternship/:internshipId",
  auth([roles.student]),
  hostMulter(fileTypes.pdf).single("resume"),
  validation(JV.ApplyToInternshipSchema),
  JS.ApplyToInternship,
);

// ─────────────────────────────────────────────
// APPLICATION ROUTES
// ─────────────────────────────────────────────

// PATCH /api/internship/responseApp/:appId
internshipRouter.patch(
  "/responseApp/:appId",
  validation(JV.responseAppSchema),
  auth(Object.values(roles)),
  JS.responseApp
);

// ─────────────────────────────────────────────
// INTERNSHIP BY ID ROUTES  ← must be last (wildcard :internshipId)
// ─────────────────────────────────────────────

// GET /api/internship/:internshipId  (overview)
internshipRouter.get(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.getInternshipById
);

// GET /api/internship/:internshipId/reviews
internshipRouter.get(
  "/:internshipId/reviews",
  validation(JV.InternshipIdSchema),
  JS.getReviews
);

// POST /api/internship/:internshipId/reviews
internshipRouter.post(
  "/:internshipId/reviews",
  validation(JV.addReviewSchema),
  auth([roles.student]),
  JS.addReview
);

// PATCH /api/internship/:internshipId  (update)
internshipRouter.patch(
  "/:internshipId",
  validation(JV.updateInternshipSchema),
  auth([roles.company, roles.admin]),
  JS.updateInternship
);

// DELETE /api/internship/:internshipId
internshipRouter.delete(
  "/:internshipId",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.deleteInternship
);

// GET /api/internship/:internshipId/internshipApp
internshipRouter.get(
  "/:internshipId/internshipApp",
  validation(JV.InternshipIdSchema),
  auth(Object.values(roles)),
  JS.getInternshipApp
);

export default internshipRouter;