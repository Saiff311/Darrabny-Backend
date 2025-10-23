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