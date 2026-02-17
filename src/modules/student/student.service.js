import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";

//--------------------------------Etoo--------------------------------------------------------
export const UpdateStudentAccount = asyncHandler( async (req, res, next)=>{
    //update account via this way so the encryption hook works (doesn't work with updateOne())
    const { fullName, about, links } = req.body;

    const user = await userModel.findById(req.user._id);
    
    if (fullName) {
        const nameParts = fullName.trim().split(" ");
        user.firstName = nameParts.shift();
        user.lastName = nameParts.join(" ");
    }

    if (about) {
        user.about = about;
    }
    
    if (links && typeof links === "object") {
        user.links = {
        linkedin: links.linkedin ?? user.links?.linkedin,
        github: links.github ?? user.links?.github,
        };
    }

    await user.save();

    return res.status(200).json({
        msg: "User account updated successfully",
        user
    });
})

//--------------------------------Etoo--------------------------------------------------------
export const getLoginStudent = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    .select("-notifications -DOB -provider -isConfirmed -isDeleted -password -otp")
    // decrypt mobile number
    user.mobileNumber = await decrypt(user.mobileNumber)
    return res.status(200).json({msg: "My Profile",user}) 
})

export const getAnotherUser = asyncHandler( async (req, res, next)=>{
    const {id} = req.params
    //U should select first & last name so the userName appears!
    const doc = await userModel.findById(id).select("firstName lastName mobileNumber profilePic coverPic")
    //show user name
    const user = doc.toObject({virtuals: true})
    if (!user) {
        return res.status(404).json({ msg: "User not found" });
    }
    //decrypt mobile number
    user.mobileNumber = await decrypt(user.mobileNumber)
    return res.status(200).json({msg: "My Profile", user}) 
})

export const updatePassword = asyncHandler( async (req, res, next)=>{
    const {oldPassword, newPassword} = req.body
    if(! await compare(oldPassword, req.user.password)){
        return next(new Error("Invalid old password", {cause: 400}))
    }
    //update password via this way so the hashing hook works (doesn't work with updateOne())
    const user = await userModel.findById(req.user._id);
    user.password = newPassword;
    user.changePassword = Date.now()
    await user.save(); // 
    return res.status(200).json({msg: "Password updated successfully"})
})

export const UploadProfilePic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    //delete old profile pic
    if(user.profilePic.public_id){
        await cloudinary.uploader.destroy(user.profilePic.public_id)
    }
    //upload profile pic to cloudinary
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile pics"
    })
    console.log("file:" + req.file);
    
    const profilePic = {secure_url, public_id}
    await userModel.updateOne({_id: req.user._id}, {profilePic})
    return res.status(200).json({msg: "Profile Pic uploaded successfully"})
})

export const UploadCoverPic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    //delete old profile pic
    if(user.coverPic.public_id){
        await cloudinary.uploader.destroy(user.coverPic.public_id)
    }
    //upload profile pic to cloudinary
    const {secure_url, public_id} = await cloudinary.uploader.upload(req.file.path, {
        folder: "cover pics"
    })
    const coverPic = {secure_url, public_id}
    await userModel.updateOne({_id: req.user._id}, {coverPic})
    return res.status(200).json({msg: "Cover Pic uploaded successfully"})
})

export const deleteProfilePic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    if (!user.profilePic.public_id) {
        return next(new Error("Profile picture not found!", { cause: 404 }));
    }
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy( user.profilePic.public_id);    
    if (result.result !== "ok") {
        return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
    }
    await userModel.updateOne({_id: req.user._id}, {$unset: {profilePic:""}})
    return res.status(200).json({msg: "Profile Pic deleted successfully"})
})

export const deleteCoverPic = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    if (!user.coverPic.public_id) {
        return next(new Error("Cover picture not found!", { cause: 404 }));
    }
    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(user.coverPic.public_id);
    if (result.result !== "ok") {
        return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
    }
    await userModel.updateOne({_id: req.user._id}, {$unset: {coverPic:""}})
    return res.status(200).json({msg: "Cover Pic deleted successfully"})
})

export const softDelete = asyncHandler(async (req, res, next) => {
    
    await userModel.updateOne({_id: req.user._id}, {isDeleted: true, deletedAt: Date.now()})

    return res.status(200).json({ msg: "Account Deleted Successfully", });
});

// export const saveInternship = asyncHandler(async(req,res,next)=>{})
