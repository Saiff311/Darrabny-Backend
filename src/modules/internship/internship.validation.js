import Joi from "joi";
import { generalRules } from "../../utils/generalRules.js";
import { appStatus, internshipLocations, workingTimes } from "../../utils/enums.js";

export const addInternshipSchema = Joi.object({
    internshipTittle:Joi.string().trim().required(),
    internshipLocation:Joi.string().valid(...Object.values(internshipLocations)).required(),
    workingTime:Joi.string().valid(...Object.values(workingTimes)).required(),
    internshipDescription:Joi.string().trim().min(10).required(),
    technicalSkills:Joi.array().items(Joi.string()).min(1).required(),
    softSkills:Joi.array().items(Joi.string()).min(1).required(),
    companyId:generalRules.id.required()
})

export const updateInternshipSchema = Joi.object({
    internshipTittle:Joi.string().trim(),
    internshipLocation:Joi.string().valid(...Object.values(internshipLocations)),
    workingTime:Joi.string().valid(...Object.values(workingTimes)),
    internshipDescription:Joi.string().trim().min(10),
    technicalSkills:Joi.array().items(Joi.string()).min(1),
    softSkills:Joi.array().items(Joi.string()).min(1),
    internshipId:generalRules.id.required(),
    closed: Joi.boolean()
})

export const responseAppSchema = Joi.object({
    appId:generalRules.id.required(),
    companyId:generalRules.id.required(),
    status: Joi.string().valid(...Object.values(appStatus)).required()

})

export const getCompanyInternshipsSchema = Joi.object({
    // params
    companyId:generalRules.id,
    // query
    companyName: Joi.string().trim().min(3).max(50),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(30).default(6),
    sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTittle", "-internshipTittle")
    .default("-createdAt")

}).or('companyId', 'companyName');

export const InternshipIdSchema = Joi.object({
    internshipId:generalRules.id.required()
})

export const getFilteredInternshipsSchema = Joi.object({
    // query
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(30).default(6),
    sort: Joi.string()
    .valid("createdAt", "-createdAt", "internshipTittle", "-internshipTittle")
    .default("-createdAt"),
    internshipTittle:Joi.string().trim(),
    internshipLocation:Joi.string().valid(...Object.values(internshipLocations)),
    workingTime:Joi.string().valid(...Object.values(workingTimes)),
    internshipDescription:Joi.string().trim().min(10),
    technicalSkills:Joi.array().items(Joi.string()).min(1),
    softSkills:Joi.array().items(Joi.string()).min(1),
    closed: Joi.boolean()
})