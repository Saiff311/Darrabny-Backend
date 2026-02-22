import { genders } from "../../utils/enums.js";
import { generalRules } from "../../utils/generalRules.js";
import joi from "joi"

export const UpdateStudentAccountSchema = 
   joi.object({
        fullName: joi.string()
            .trim()
            .min(2)
            .pattern(/^[A-Za-z\s]+$/)
            .messages({
            "string.pattern.base": "Full name must contain only letters and spaces"
            }),
        about : joi.string().max(2000).trim(),
        links: joi.object({
            linkedin: joi.string().uri().optional(),
            github: joi.string().uri().optional(),
        })
    }).min(1)

export const addSkillSchema =  joi.object({
    skillName : joi.string().trim().min(2).max(100).required()
})

export const deleteSkillSchema =  joi.object({
    skill : joi.string().trim().min(2).max(100).required()
})

export const addProjectSchema = joi.object({
    type: joi.string().valid('personal', 'course').required(),
    title: joi.string().required(),
    description: joi.string().required(),
    thumbnail: joi.string().required(),
    link: joi.string().uri().required(),
});

export const updateProjectSchema = joi.object({
    projectId: generalRules.id.required(),
    type: joi.string().valid('personal', 'course'),
    title: joi.string(),
    description: joi.string(),
    thumbnail: joi.string(),
    link: joi.string().uri(),
}).min(1);

export const deleteProjectSchema = joi.object({
    projectId: generalRules.id.required(),
});

export const UploadResumeSchema = joi.object({
    file: generalRules.file.required()
})

export const getAnotherUserSchema =  joi.object({
    id : joi.string().length(24).hex().required()
})

export const UploadCoverPicSchema = joi.object({
    file: generalRules.file.required()
})

export const updatePasswordSchema = joi.object({
    oldPassword : generalRules.password.required(),
    newPassword : generalRules.password.required(),
    confirmPassword :generalRules.password.required().valid(joi.ref("newPassword")),
})
