import { genders } from "../../utils/enums.js";
import { generalRules } from "../../utils/generalRules.js";
import joi from "joi"

export const addCompanySchema = joi.object({
    companyName: joi.string().trim().min(2).max(60).required(),
    description: joi.string().trim().min(10).required(),
    industry: joi.string().trim().required(),
    address: joi.string().trim().required(),
    companyEmail: generalRules.email,
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

export const updateCompanySchema = joi.object({
    companyId: generalRules.id,
    companyName: joi.string().trim().min(2).max(60),
    description: joi.string().trim().min(10),
    industry: joi.string().trim(),
    address: joi.string().trim(),
    companyEmail: generalRules.email,
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
export const softDeleteCompanySchema = joi.object({
    companyId : joi.string().length(24).hex().required()
})

export const getCompanySchema = joi.object({
    companyId : joi.string().length(24).hex().required()
})

export const getCompanyByNameSchema = joi.object({
    name : joi.string().required()
})

export const uploadCompanyLogoSchema = joi.object({
    file: generalRules.file.required(),
    companyId : joi.string().length(24).hex().required()
})

export const UploadCompanyCoverSchema = joi.object({
    file: generalRules.file.required(),
    companyId : joi.string().length(24).hex().required()
})
export const deleteCompanyLogoSchema = joi.object({
    companyId : joi.string().length(24).hex().required()
})
export const deleteCompanyCoverSchema = joi.object({
    companyId : joi.string().length(24).hex().required()
})