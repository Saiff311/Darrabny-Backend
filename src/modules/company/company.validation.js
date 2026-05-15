import { generalRules } from "../../utils/generalRules.js";
import joi from "joi";

export const addCompanySchema = joi.object({
  companyName: joi.string().trim().min(2).max(60).required(),
  description: joi.string().trim().min(10).required(),
  industry: joi.string().trim().required(),
  address: joi.string().trim().required(),
  companyEmail: generalRules.email,
  HRs: joi.array().items(generalRules.id),
  legalAttachment: generalRules.file,
  numberOfEmployees: joi
    .string()
    .required()
    .custom((value, helpers) => {
      try {
        const data = JSON.parse(value);
        if (
          typeof data === "object" &&
          data.form &&
          data.to &&
          !isNaN(data.form) &&
          !isNaN(data.to) &&
          data.form <= data.to
        ) {
          return data;
        }
      } catch (err) {
        return helpers.error("any.required");
      }
    }),
});

export const updateCompanySchema = joi.object({
  companyId: generalRules.id,
  companyName: joi.string().trim().min(2).max(60),
  description: joi.string().trim().min(10),
  industry: joi.string().trim(),
  address: joi.string().trim(),
  companyEmail: generalRules.email,
  HRs: joi.array().items(generalRules.id),
  numberOfEmployees: joi.string().custom((value, helpers) => {
    try {
      const data = JSON.parse(value);
      if (
        typeof data === "object" &&
        data.form &&
        data.to &&
        !isNaN(data.form) &&
        !isNaN(data.to) &&
        data.form <= data.to
      ) {
        return data;
      }
    } catch (err) {
      return helpers.error("any.required");
    }
  }),
});
export const softDeleteCompanySchema = joi.object({
  companyId: joi.string().length(24).hex().required(),
});

export const getCompanySchema = joi.object({
  companyId: joi.string().length(24).hex().required(),
});

export const getCompanyByNameSchema = joi.object({
  name: joi.string().required(),
});

export const uploadCompanyLogoSchema = joi.object({
  file: generalRules.file.required(),
  companyId: joi.string().length(24).hex().required(),
});

export const UploadCompanyCoverSchema = joi.object({
  file: generalRules.file.required(),
  companyId: joi.string().length(24).hex().required(),
});
export const deleteCompanyLogoSchema = joi.object({
  companyId: joi.string().length(24).hex().required(),
});
export const deleteCompanyCoverSchema = joi.object({
  companyId: joi.string().length(24).hex().required(),
});

// ------------------ Company Signup ------------------
export const companySignupSchema = joi.object({
  companyName: joi.string().trim().min(2).max(60).required(),
  email: generalRules.email.required(),
  password: generalRules.password.required(),

  // confirm password
  confirmPassword: generalRules.password
    .valid(joi.ref("password"))
    .required()
    .messages({
      "any.only": "Password and confirm password must match",
    }),

  companyPhone: joi
    .string()
    .trim()
    .pattern(/^[0-9+\-\s]{7,20}$/)
    .required(),
  description: joi.string().trim().min(10),
  industry: joi.string().trim(),
  address: joi.string().trim(),

  numberOfEmployees: joi
    .object({
      from: joi.number().required(),
      to: joi.number().required(),
    })
    .required(),
});

// ------------------ Company Login ------------------
export const companyLoginSchema = joi.object({
  email: generalRules.email.required(),
  password: joi.string().required(),
});


export const sendEndorsementRequestSchema = joi.object({
  internshipId: generalRules.id.required(),
  universityId: generalRules.id.required(),
});

export const getCompanyApplicationsSchema = joi.object({
  status: joi
    .string()
    .valid("pending", "accepted", "rejected", "all")
    .default("pending"),

  page: joi.number().min(1).default(1),

  limit: joi.number().min(1).max(100).default(10),

  sort: joi.string().valid("newest").default("newest"),
});


// ------------------ emptySchema ------------------
export const emptySchema = joi.object().length(0);

// ------------------ Verification Documents ------------------
export const uploadVerificationDocumentSchema = joi.object({
  documentName: joi.string().trim().min(2).max(120).required(),
});

export const deleteVerificationDocumentSchema = joi.object({
  docId: generalRules.id.required(),
});

// ------------------ Company Settings ------------------
export const updateCompanySettingsSchema = joi
  .object({
    companyName: joi.string().trim().min(2).max(60).optional(),
    email: generalRules.email.optional(),
    companyPhone: joi
      .string()
      .trim()
      .pattern(/^[0-9+\-\s]{7,20}$/)
      .optional(),
    address: joi.string().trim().min(3).max(255).optional(),
  })
  .or("companyName", "email", "companyPhone", "address");

export const updateNotificationPreferencesSchema = joi
  .object({
    email: joi.boolean().optional(),
    push: joi.boolean().optional(),
  })
  .or("email", "push");

export const searchCompaniesSchema = joi.object({
  q: joi.string().allow(""),
  industry: joi.string(),
  location: joi.string(),
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(50).default(10),
  sort: joi.string().valid("relevant", "popular").default("relevant"),
});

export const getAllCompaniesSchema = joi.object({
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(50).default(10),
  sort: joi.string().valid("popular", "newest").default("newest"),
});

export const getCompanyInternshipsSchema = joi.object({
  companyId: generalRules.id.required(),
  page: joi.number().min(1).default(1),
  limit: joi.number().min(1).max(50).default(10),
});

// ========================= Add Company Review =========================
export const addCompanyReviewSchema = joi.object({
  companyId: generalRules.id.required(),

  rating: joi.number().min(1).max(5).required(),

  comment: joi.string().trim().min(3).max(1000).optional(),
});

// ------------------ Get Company Reviews ------------------
export const getCompanyReviewsSchema = joi.object({
  companyId: generalRules.id.required(),
});

// ========================= Get My Company =========================
export const getMyCompanySchema = joi.object({});

// ========================= Update My Company =========================
export const updateMyCompanySchema = joi
  .object({
    companyName: joi.string().trim().min(2).max(60),

    description: joi.string().trim().min(10),

    industry: joi.string().trim(),

    address: joi.string().trim(),

    companyPhone: joi
      .string()
      .trim()
      .pattern(/^[0-9+\-\s]{7,20}$/),

    numberOfEmployees: joi.object({
      from: joi.number().min(1),
      to: joi.number().min(1),
    }),
  })
  .min(1);