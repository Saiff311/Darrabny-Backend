import Joi from "joi";
import { generalRules } from "../../utils/generalRules.js";
import {
  appStatus,
  internshipLocations,
  internshipStatus,
  seniorityLevels,
  workingTimes,
} from "../../utils/enums.js";

// ========================== Add Internship Validation ==========================
export const addInternshipSchema = Joi.object({
  internshipTittle: Joi.string().trim().required(),

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

  seniorityLevel: Joi.string()
    .valid(...Object.values(seniorityLevels))
    .required(),

  status: Joi.string()
    .valid(...Object.values(internshipStatus))
    .optional(),

  startDate: Joi.date().required(),

  durationInMonths: Joi.number().integer().min(1).required(),

  thumbnail: Joi.string().uri().optional(),

  closed: Joi.boolean().optional(),
});
// ========================== Update Internship Validation ==========================
export const updateInternshipSchema = Joi.object({
  internshipTittle: Joi.string().trim(),
  internshipLocation: Joi.string().valid(...Object.values(internshipLocations)),
  workingTime: Joi.string().valid(...Object.values(workingTimes)),
  internshipDescription: Joi.string().trim().min(10),
  technicalSkills: Joi.array().items(Joi.string()).min(1),
  softSkills: Joi.array().items(Joi.string()).min(1),
  internshipId: generalRules.id.required(),
  closed: Joi.boolean(),
});

// ========================== Response Application Validation ==========================
export const responseAppSchema = Joi.object({
  appId: generalRules.id.required(),
  companyId: generalRules.id.required(),
  status: Joi.string()
    .valid(...Object.values(appStatus))
    .required(),
});

// ========================== Get Company Internships Validation ==========================
export const getCompanyInternshipsSchema = Joi.object({
  companyName: Joi.string().trim().min(3).max(50).optional(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(30).default(6),
  sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTittle", "-internshipTittle")
    .default("-createdAt"),
});

// ========================== Internship ID Validation ==========================
export const InternshipIdSchema = Joi.object({
  internshipId: generalRules.id.required(),
});

// ========================== Filter Internships Validation ==========================
export const getFilteredInternshipsSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(30).default(6),
  sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTittle", "-internshipTittle")
    .default("-createdAt"),
  internshipTittle: Joi.string().trim(),
  internshipLocation: Joi.string().valid(...Object.values(internshipLocations)),
  workingTime: Joi.string().valid(...Object.values(workingTimes)),
  internshipDescription: Joi.string().trim().min(10),
  technicalSkills: Joi.array().items(Joi.string()).min(1),
  softSkills: Joi.array().items(Joi.string()).min(1),
  closed: Joi.boolean(),
});

// ========================== Apply To Internship Validation ==========================
export const ApplyToInternshipSchema = Joi.object({
  internshipId: generalRules.id.required(),
  coverLetter: Joi.string().trim().min(3).max(5000).optional().allow("", null),
  skills: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().trim().min(1)).min(1),
      Joi.string().trim().min(1),
    )
    .optional(),
});
