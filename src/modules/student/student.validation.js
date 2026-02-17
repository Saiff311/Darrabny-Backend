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

export const getAnotherUserSchema =  joi.object({
    id : joi.string().length(24).hex().required()
})

export const UploadProfilePicSchema = joi.object({
    file: generalRules.file.required()
})

export const UploadCoverPicSchema = joi.object({
    file: generalRules.file.required()
})

export const updatePasswordSchema = joi.object({
    oldPassword : generalRules.password.required(),
    newPassword : generalRules.password.required(),
    confirmPassword :generalRules.password.required().valid(joi.ref("newPassword")),
})
