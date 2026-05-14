import { genders } from "../../utils/enums.js";
import { generalRules } from "../../utils/generalRules.js";
import joi from "joi"

export const addCollegeSchema = joi.object({
    collegeName: joi.string().trim().min(2).max(60).required(),
    description: joi.string().trim().min(10).required(),
    industry: joi.string().trim().required(),
    address: joi.string().trim().required(),
    collegeEmail: generalRules.email,
    HRs: joi.array().items(generalRules.id),
    legalAttachment: generalRules.file,
    numberOfEmployees: joi.string().required().custom((value, helpers) => {
        try{
            const data = JSON.parse(value)
            if(
                typeof data === "object" &&
                data.form &&
                data.to &&
                !isNaN(data.form) &&
                !isNaN(data.to) &&
                data.form <= data.to
            ){
                return data
            }
        }catch(err){
            return helpers.error("any.required")
        }
    })
})

export const updateCollegeSchema = joi.object({
    collegeId: generalRules.id,
    collegeName: joi.string().trim().min(2).max(60),
    description: joi.string().trim().min(10),
    industry: joi.string().trim(),
    address: joi.string().trim(),
    collegeEmail: generalRules.email,
    HRs: joi.array().items(generalRules.id),
    numberOfEmployees: joi.string().custom((value, helpers) => {
        try{
            const data = JSON.parse(value)
            if(
                typeof data === "object" &&
                data.form &&
                data.to &&
                !isNaN(data.form) &&
                !isNaN(data.to) &&
                data.form <= data.to
            ){
                return data
            }
        }catch(err){
            return helpers.error("any.required")
        }
    })
})
export const softDeleteCollegeSchema = joi.object({
    collegeId : joi.string().length(24).hex().required()
})

export const getCollegeSchema = joi.object({
    collegeId : joi.string().length(24).hex().required()
})

export const getCollegeByNameSchema = joi.object({
    name : joi.string().required()
})

export const uploadCollegeLogoSchema = joi.object({
    file: generalRules.file.required(),
    collegeId : joi.string().length(24).hex().required()
})

export const UploadCollegeCoverSchema = joi.object({
    file: generalRules.file.required(),
    collegeId : joi.string().length(24).hex().required()
})
export const deleteCollegeLogoSchema = joi.object({
    collegeId : joi.string().length(24).hex().required()
})
export const deleteCollegeCoverSchema = joi.object({
    collegeId : joi.string().length(24).hex().required()
})

export const collegeSignupSchema = joi.object({
    collegeName: joi.string().trim().min(2).max(120).required(),
    collegeEmail: generalRules.email.required(),
    password: generalRules.password.required(),
    confirmPassword: generalRules.password.valid(joi.ref("password")).required(),
    address: joi.string().trim().min(3).max(255).required(),
    departments: joi.array().items(
        joi.object({
            name: joi.string().trim().required(),
            head: joi.string().trim().required(),
        })
    ).optional(),
});

export const getAllUniversitiesSchema = joi.object({
  name: joi.string().trim().optional(),
});


export const collegeSigninSchema = joi.object({
    email: generalRules.email.required(),
    password: joi.string().required(),
});

export const respondToEndorsementRequestSchema = joi.object({
    requestId: generalRules.id.required(),
    status: joi.string().valid("approved", "rejected").required(),
})

export const getCollegePartnersSchema = {
    query: joi.object({
        page: joi.number().integer().min(1).optional(),
        limit: joi.number().integer().min(1).max(100).optional(),
        search: joi.string().trim().optional(),
        industry: joi.string().trim().optional(),
        location: joi.string().trim().optional(),
    }),
}

// ------------------ emptySchema ------------------
export const emptySchema = joi.object().length(0)

// ------------------ College Settings ------------------
export const updateCollegeSettingsSchema = joi
    .object({
        collegeName: joi.string().trim().min(2).max(60).optional(),
        collegeEmail: generalRules.email.optional(),
        address: joi.string().trim().min(3).max(255).optional(),
    })
    .or("collegeName", "collegeEmail", "address")

export const updateNotificationPreferencesSchema = joi
    .object({
        email: joi.boolean().optional(),
        push: joi.boolean().optional(),
    })
    .or("email", "push")


