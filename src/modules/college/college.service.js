import collegeModel from "../../DB/models/college.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";

export const addCollege = asyncHandler( async (req, res, next)=>{
    const {collegeName, collegeEmail} = req.body
    if(await collegeModel.findOne({$or:[ {collegeName}, {collegeEmail}]})){
        return next(new Error("College email or name already exists!", {cause:409}))
    }
    req.body.createdBy = req.user._id
    // req.body.numberOfEmployees = JSON.parse(req.body.numberOfEmployees)
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "college-attachments"
    })
    const attachment = {
        secure_url,
        public_id
    }
    req.body.legalAttachment = attachment
    const newCollege = await collegeModel.create(req.body)
    return res.json({msg: "College added successfully",newCollege})
})

export const updateCollege = asyncHandler(async(req,res, next)=>{
    const {collegeId} = req.params
    const {collegeName, collegeEmail} = req.body
    const college = await collegeModel.findById({
        _id: collegeId,
        createdBy: req.user._id,
        deletedAt: {
            $exists: false
        },
    })
    if(college.bannedAt){
        return next(new Error("College is banned",{cause:403}))
    }
    if(collegeEmail && collegeEmail !== college.collegeEmail){
        const existCollege = await collegeModel.findOne({collegeEmail})
        if(existCollege){
            return next(new Error("College email already exists!", {cause:409}));
        }
    }
    if(collegeName && collegeName !== college.collegeName){
        const existCollege = await collegeModel.findOne({collegeName})
        if(existCollege){
            return next(new Error("College name already exists!", {cause:409}));
        }
    }
    Object.assign(college, req.body);
    await college.save();
    return res.json({ msg: "College updated successfully", college });
})

export const softDeleteCollege = asyncHandler(async(req,res,next)=>{
    const {collegeId} = req.params
    const college = await collegeModel.findById({
        _id: collegeId,
        deletedAt: {
            $exists: false
        }
    })
    if(!college){
        return next(new Error("College not found",{cause:404}))
    }
    if(req.user.role !== roles.admin && req.user._id.toString() !==college.createdBy.toString()){
        return next(new Error("You are not authorized to perform this action!", {cause:403}));
    }
    college.deletedAt = new Date();
    await college.save();
    return res.json({ msg: "College deleted successfully", college });

})

export const getCollege = asyncHandler(async(req,res,next)=>{ 
    const {collegeId} = req.params
    const college = await collegeModel.findById({
        _id: collegeId,
        deletedAt: {
            $exists: false
        }
    }).populate({
        path: "jobs",
        match: {
            deletedAt: {$exists: false}
        }
    })
    if(!college){
        return next(new Error("College not found!", {cause:404}));
    }
    return res.json({msg: "College fetched successfully",college})
})

export const getCollegeByName = asyncHandler(async(req,res,next)=>{ 
    const {name} = req.query
    const college = await collegeModel.find({
        collegeName: {
            $regex: name,
            $options: "i"
        },
        deletedAt: {
            $exists: false
        }
    })
    if(!college){
        return next(new Error("College not found!", {cause:404}));
    }
    return res.json({msg: "College fetched successfully",college})
})

export const uploadCollegeLogo = asyncHandler( async (req, res, next)=>{
    const {collegeId} = req.params 
    const college = await collegeModel.findOne({
        _id: collegeId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!college){
        return next(new Error("College not found!", {cause:404}));
    }
    if(college.bannedAt){
        return next(new Error("College is banned!", {cause:403}));
    }
    if(college.logo.public_id){
        await cloudinary.uploader.destroy(college.logo.public_id);
    }
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "logo pics"
    })
    const logo = {secure_url, public_id}
    await collegeModel.updateOne({_id: collegeId}, {logo})
    return res.status(200).json({msg: "Logo Pic uploaded successfully"})
})

export const UploadCollegeCover = asyncHandler( async (req, res, next)=>{
    const {collegeId} = req.params 
    const college = await collegeModel.findOne({
        _id: collegeId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!college){
        return next(new Error("College not found!", {cause:404}));
    }
    if(college.bannedAt){
        return next(new Error("College is banned!", {cause:403}));
    }
    if(college.coverPic.public_id){
        await cloudinary.uploader.destroy(college.coverPic.public_id);
    }
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "coverCollege pics"
    })
    const coverPic = {secure_url, public_id}
    await collegeModel.updateOne({_id: collegeId}, {coverPic})
    return res.status(200).json({msg: "Logo Pic uploaded successfully"})
})

export const deleteCollegeLogo = asyncHandler( async (req, res, next)=>{
     const {collegeId} = req.params 
    const college = await collegeModel.findOne({
        _id: collegeId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!college){
        return next(new Error("College not found!", {cause:404}));
    }
    if(college.bannedAt){
        return next(new Error("College is banned!", {cause:403}));
    }
    if(college.logo.public_id){
        await cloudinary.uploader.destroy(college.logo.public_id);
    }
    await collegeModel.updateOne({_id:collegeId}, {$unset: {logo:""}})
    return res.status(200).json({msg: "Logo deleted successfully"})
})

export const deleteCollegeCover = asyncHandler( async (req, res, next)=>{
    const {collegeId} = req.params 
    const college = await collegeModel.findOne({
        _id: collegeId,
        deletedAt: {
            $exists: false
        },
        createdBy: req.user._id
    })
    if (!college){
        return next(new Error("College not found!", {cause:404}));
    }
    if(college.bannedAt){
        return next(new Error("College is banned!", {cause:403}));
    }
    if(college.coverPic.public_id){
        await cloudinary.uploader.destroy(college.coverPic.public_id);
    }
    await collegeModel.updateOne({_id: collegeId}, {$unset: {coverPic:""}})
    return res.status(200).json({msg: "Cover Pic deleted successfully"})
})
