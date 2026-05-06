import Joi from "joi";
import { generalRules } from "../../utils/generalRules.js";
import { reportStatus } from "../../utils/enums.js";

export const reportPrefillSchema = Joi.object({
  id: generalRules.id.required(),          // internshipId
  studentId: generalRules.id.required(),
  period: Joi.string()
    .pattern(/^\d{4}-\d{2}$/)             // مثال: 2025-07
    .required(),
});

export const createReportSchema = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
  body: Joi.object({
    studentId: generalRules.id.required(),
    periodStart: Joi.date().required(),
    periodEnd: Joi.date().required(),
    title: Joi.string().trim().min(3).max(200).required(),
    keyAchievements: Joi.string().trim().allow("", null).optional(),
    challengesFaced: Joi.string().trim().allow("", null).optional(),
    learningOutcomes: Joi.string().trim().allow("", null).optional(),
    tasksCompleted: Joi.string().trim().allow("", null).optional(),
    attendanceNotes: Joi.string().trim().allow("", null).optional(),
    selfAssessment: Joi.alternatives().try(
      Joi.string().trim().min(3),
      Joi.object({
        technicalSkill: Joi.number().min(0).max(100),
        problemSolving: Joi.number().min(0).max(100),
        communication: Joi.number().min(0).max(100),
        initiative: Joi.number().min(0).max(100),
      })
    ).optional(),
    internalNote: Joi.string().optional().allow("", null),
    status: Joi.string().valid("draft", "ongoing", "in-progress").default("draft"),
  }),
};

export const updateReportSchema = Joi.object({
  id: generalRules.id.required(),

  keyAchievements: Joi.string().trim().allow("", null).optional(),
  challengesFaced: Joi.string().trim().allow("", null).optional(),
  learningOutcomes: Joi.string().trim().allow("", null).optional(),
  tasksCompleted: Joi.string().trim().allow("", null).optional(),
  attendanceNotes: Joi.string().trim().allow("", null).optional(),
  internalNote: Joi.string().trim().optional(),

  status: Joi.string()
    .valid(...Object.values(reportStatus), "in-progress")
    .optional(),

  selfAssessment: Joi.alternatives().try(
    Joi.string().trim().min(3),
    Joi.object({
      technicalSkill: Joi.number().min(0).max(100),
      problemSolving: Joi.number().min(0).max(100),
      communication: Joi.number().min(0).max(100),
      initiative: Joi.number().min(0).max(100),
    })
  ).optional(),
});

export const getReportDetailsSchema = {
  params: Joi.object({
    id: generalRules.id.required() // validates the :id route param
  })
};

export const updateReportStatusSchema = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
  body: Joi.object({
    status: Joi.string()
      .valid(
        "submitted",
        "under_review",
        "needs_changes",
        "approved"
      )
      .required(),
  }),
};

export const downloadReportPDFSchema = {
  params: Joi.object({
    id: generalRules.id.required(),
  }),
};