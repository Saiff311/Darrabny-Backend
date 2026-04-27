import Joi from "joi";
import { generalRules } from "../../utils/generalRules.js";
import {
  appStatus,
  internshipLocations,
  internshipStatus,
  workingTimes,
} from "../../utils/enums.js";

// ========================== Add Internship ==========================
export const addInternshipSchema = Joi.object({
  internshipTitle: Joi.string().trim().required(),   // ✅ internshipTitle

  internshipLocation: Joi.string()
    .valid(...Object.values(internshipLocations))
    .required(),

  workingTime: Joi.string()
    .valid(...Object.values(workingTimes))
    .required(),

  internshipDescription: Joi.string().trim().min(10).required(),

  technicalSkills: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .required(),

  softSkills: Joi.alternatives()
    .try(Joi.array().items(Joi.string()), Joi.string())
    .required(),

  status: Joi.string()
    .valid(...Object.values(internshipStatus))
    .optional(),

  startDate: Joi.date().required(),

  durationInMonths: Joi.number().integer().min(1).required(),

  thumbnail: Joi.string().uri().optional(),

  closed: Joi.boolean().optional(),

  isFeatured: Joi.boolean().optional(),

  supervisorId: generalRules.id.required(),
});

// ========================== Update Internship ==========================
export const updateInternshipSchema = Joi.object({
  internshipTitle: Joi.string().trim(),              // ✅ internshipTitle
  internshipLocation: Joi.string().valid(...Object.values(internshipLocations)),
  workingTime: Joi.string().valid(...Object.values(workingTimes)),
  internshipDescription: Joi.string().trim().min(10),
  technicalSkills: Joi.array().items(Joi.string()).min(1),
  softSkills: Joi.array().items(Joi.string()).min(1),
  internshipId: generalRules.id.required(),
  closed: Joi.boolean(),
  isFeatured: Joi.boolean(),
});

// ========================== Response Application ==========================
export const responseAppSchema = Joi.object({
  appId: generalRules.id.required(),
  companyId: generalRules.id.required(),
  status: Joi.string()
    .valid(...Object.values(appStatus))
    .required(),
});

// ========================== Get Company Internships ==========================
export const getCompanyInternshipsSchema = Joi.object({
  companyName: Joi.string().trim().min(3).max(50).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(30).default(6),
  sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTitle", "-internshipTitle")  // ✅
    .default("-createdAt"),
});

// ========================== Internship ID ==========================
export const InternshipIdSchema = Joi.object({
  internshipId: generalRules.id.required(),
});

// ========================== Filter Internships ==========================
export const getFilteredInternshipsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(30).default(6),
  sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTitle", "-internshipTitle")  // ✅
    .default("-createdAt"),
  internshipTitle: Joi.string().trim(),              // ✅
  internshipLocation: Joi.string().valid(...Object.values(internshipLocations)),
  workingTime: Joi.string().valid(...Object.values(workingTimes)),
  internshipDescription: Joi.string().trim().min(10),
  technicalSkills: Joi.array().items(Joi.string()).min(1),
  softSkills: Joi.array().items(Joi.string()).min(1),
  closed: Joi.boolean(),
});

// ========================== Apply To Internship ==========================
export const ApplyToInternshipSchema = Joi.object({
  internshipId: generalRules.id.required(),
  coverLetter: Joi.string().trim().min(3).max(5000).optional().allow("", null),
  skills: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim().min(1)).min(1),
      Joi.string().trim().min(1)
    )
    .optional(),
});

// ========================== LANDING: Search Preview ==========================
export const searchPreviewSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
});

// ========================== LISTING: Advanced Search ==========================
export const searchInternshipsSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).optional(),
  internshipLocation: Joi.string()
    .valid(...Object.values(internshipLocations))
    .optional(),
  workingTime: Joi.string()
    .valid(...Object.values(workingTimes))
    .optional(),
  technicalSkills: Joi.string().optional(), // comma-separated: "react,node"
  durationInMonths: Joi.number().integer().min(1).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(20).default(10),
  sort: Joi.string().optional()
});

// ========================== REVIEWS: Add Review ==========================
export const addReviewSchema = Joi.object({
  internshipId: generalRules.id.required(),
  rating: Joi.number().min(1).max(5).required(),
  comment: Joi.string().trim().max(1000).optional().allow("", null),
});