import companyModel from "../../DB/models/company.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";

export const addCompany = asyncHandler( async (req, res, next)=>{
    const {companyName, companyEmail} = req.body
    if(await companyModel.findOne({$or:[ {companyName}, {companyEmail}]})){
        return next(new Error("Company email or name already exists!", {cause:409}))
    }
    req.body.createdBy = req.user._id
    req.body.numberOfEmployees = JSON.parse(req.body.numberOfEmployees)
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "company-attachments"
    })
    const attachment = {
        secure_url,
        public_id
    }
    req.body.legalAttachment = attachment
    const newCompany = await companyModel.create(req.body)
    return res.json({msg: "Company added successfully",newCompany})
})

export const updateCompany = asyncHandler(async(req,res, next)=>{
    const {companyId} = req.params
    const {companyName, companyEmail} = req.body
    const company = await companyModel.findById({
        _id: companyId,
        createdBy: req.user._id,
        deletedAt: {
            $exists: false
        },
    })
    if(company.bannedAt){
        return next(new Error("Company is banned",{cause:403}))
    }
    if(companyEmail && companyEmail !== company.companyEmail){
        const existCompany = await companyModel.findOne({companyEmail})
        if(existCompany){
            return next(new Error("Company email already exists!", {cause:409}));
        }
    }
    if(companyName && companyName !== company.companyName){
        const existCompany = await companyModel.findOne({companyName})
        if(existCompany){
            return next(new Error("Company name already exists!", {cause:409}));
        }
    }
    Object.assign(company, req.body);
    await company.save();
    return res.json({ msg: "Company updated successfully", company });
})

export const softDeleteCompany = asyncHandler(async(req,res,next)=>{
    const {companyId} = req.params
    const company = await companyModel.findById({
        _id: companyId,
        deletedAt: {
            $exists: false
        }
    })
    if(!company){
        return next(new Error("Company not found",{cause:404}))
    }
    if(req.user.role !== roles.admin && req.user._id.toString() !==company.createdBy.toString()){
        return next(new Error("You are not authorized to perform this action!", {cause:403}));
    }
    company.deletedAt = new Date();
    await company.save();
    return res.json({ msg: "Company deleted successfully", company });

})

export const getCompany = asyncHandler(async(req,res,next)=>{ 
    const {companyId} = req.params
    const company = await companyModel.findById({
        _id: companyId,
        deletedAt: {
            $exists: false
        }
    }).populate({
        path: "jobs",
        match: {
            deletedAt: {$exists: false}
        }
    })
    if(!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    return res.json({msg: "Company fetched successfully",company})
})

export const getCompanyByName = asyncHandler(async(req,res,next)=>{ 
    const {name} = req.query
    const company = await companyModel.find({
        companyName: {
            $regex: name,
            $options: "i"
        },
        deletedAt: {
            $exists: false
        }
    })
    if(!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    return res.json({msg: "Company fetched successfully",company})
})

export const uploadCompanyLogo = asyncHandler( async (req, res, next)=>{
    const {companyId} = req.params 
    const company = await companyModel.findOne({
        _id: companyId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    if(company.bannedAt){
        return next(new Error("Company is banned!", {cause:403}));
    }
    if(company.logo.public_id){
        await cloudinary.uploader.destroy(company.logo.public_id);
    }
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "logo pics"
    })
    const logo = {secure_url, public_id}
    await companyModel.updateOne({_id: companyId}, {logo})
    return res.status(200).json({msg: "Logo Pic uploaded successfully"})
})

export const UploadCompanyCover = asyncHandler( async (req, res, next)=>{
    const {companyId} = req.params 
    const company = await companyModel.findOne({
        _id: companyId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    if(company.bannedAt){
        return next(new Error("Company is banned!", {cause:403}));
    }
    if(company.coverPic.public_id){
        await cloudinary.uploader.destroy(company.coverPic.public_id);
    }
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "coverCompany pics"
    })
    const coverPic = {secure_url, public_id}
    await companyModel.updateOne({_id: companyId}, {coverPic})
    return res.status(200).json({msg: "Logo Pic uploaded successfully"})
})

export const deleteCompanyLogo = asyncHandler( async (req, res, next)=>{
     const {companyId} = req.params 
    const company = await companyModel.findOne({
        _id: companyId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    if(company.bannedAt){
        return next(new Error("Company is banned!", {cause:403}));
    }
    if(company.logo.public_id){
        await cloudinary.uploader.destroy(company.logo.public_id);
    }
    await companyModel.updateOne({_id:companyId}, {$unset: {logo:""}})
    return res.status(200).json({msg: "Logo deleted successfully"})
})

export const deleteCompanyCover = asyncHandler( async (req, res, next)=>{
    const {companyId} = req.params 
    const company = await companyModel.findOne({
        _id: companyId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!company){
        return next(new Error("Company not found!", {cause:404}));
    }
    if(company.bannedAt){
        return next(new Error("Company is banned!", {cause:403}));
    }
    if(company.coverPic.public_id){
        await cloudinary.uploader.destroy(company.coverPic.public_id);
    }
    await companyModel.updateOne({_id: companyId}, {$unset: {coverPic:""}})
    return res.status(200).json({msg: "Cover Pic deleted successfully"})
})
