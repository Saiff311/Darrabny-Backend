import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";
import studentModel from "../../DB/models/student.model.js";

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

//--------------------------------Etoo--------------------------------------------------------
export const addSkill = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    const {skillName} = req.body
    if(user.skills.includes(skillName)){
        return next(new Error("Skill already added", {cause: 400}))
    }
    user.skills.push(skillName)
    await user.save()
    return res.status(200).json({msg: "Skill added successfully",skillName}) 
})

//--------------------------------Etoo--------------------------------------------------------
export const getSkills = asyncHandler( async (req, res, next)=>{
    const user = await userModel.findById(req.user._id)
    return res.status(200).json({msg: "Skills retrieved successfully", skills: user.skills}) 
})

//--------------------------------Etoo--------------------------------------------------------
export const deleteSkill = asyncHandler( async (req, res, next)=>{
    const { skill } = req.body;

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        { $pull: { skills: skill } },
        { new: true }
    );

    return res.status(200).json({msg: "Skill deleted successfully", userSkills: user.skills})
})

//--------------------------------Etoo--------------------------------------------------------
export const addProject = asyncHandler( async (req, res, next)=>{

    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.projects.push(req.body);
    await student.save();

    return res.status(201).json({
      message: 'Project added successfully',
      project: student.projects[student.projects.length - 1],
    });
})

//--------------------------------Etoo--------------------------------------------------------
export const getProjects = asyncHandler( async (req, res, next)=>{

    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(201).json({
      message: 'Projects retrieved successfully',
      projects: student.projects,
    });
})

//--------------------------------Etoo--------------------------------------------------------
export const updateProject = asyncHandler( async (req, res, next)=>{
    const { projectId } = req.params;

    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    // Find the original project by its ID
    const project = student.projects.id(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    // Check ownership
    if (student.userId.toString() !== req.user._id.toString()) {
      return next(new Error('You are not authorized to update this project', { cause: 403 }));
    }
    // Update project fields
    Object.assign(project, req.body);
    await student.save();

    return res.status(200).json({
      message: 'Project updated successfully',
      project,
    });
})

//--------------------------------Etoo--------------------------------------------------------
export const deleteProject = asyncHandler( async (req, res, next)=>{
    const { projectId } = req.params;

    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    // Find the original project by its ID
    const project = student.projects.id(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    // Check ownership
    if (student.userId.toString() !== req.user._id.toString()) {
      return next(new Error('You are not authorized to delete this project', { cause: 403 }));
    }
    // Remove the project from the array
    project.deleteOne();
    await student.save();

    return res.status(200).json({
      message: 'Project deleted successfully',
    });
})

export const uploadResume = asyncHandler( async (req, res, next)=>{
    if (!req.file) {
      return next(new Error('PDF file is required', { cause: 400 }));
    }

    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return next(new Error('Student not found', { cause: 404 }));
    }
    // If resume exists, delete old file from Cloudinary first
    if (student.resume?.public_id) {
      await cloudinary.uploader.destroy(student.resume.public_id, {
        resource_type: 'raw',
      });
    }

    // Upload new resume to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'raw',
      folder: 'resumes',
      format: 'pdf',
    });

    // Save to DB
    student.resume = {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
    await student.save();

    return res.status(200).json({
      fileName: req.file.originalname,
      updatedAt: new Date().toISOString().split('T')[0],
      downloadUrl: uploadResult.secure_url,
    });
})

export const downloadResume = asyncHandler( async (req, res, next)=>{
    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return next(new Error('Student not found', { cause: 404 }));
    }

    if (!student.resume?.secure_url) {
      return next(new Error('No resume uploaded yet', { cause: 404 }));
    }

    return res.status(200).json({
      downloadUrl: student.resume.secure_url,
    });
})

export const UploadProfilePic = asyncHandler( async (req, res, next)=>{
    if (!req.file) {
      return next(new Error('Image file is required', { cause: 400 }));
    }
    console.log(req.file);
    
    const student = await studentModel.findOne({ userId: req.user._id });
    if (!student) {
      return next(new Error('Student not found', { cause: 404 }));
    }

    // Delete old avatar from Cloudinary if exists
    if (student.avatar?.public_id) {
      await cloudinary.uploader.destroy(student.avatar.public_id);
    }

    // Upload new avatar
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'avatars',
      resource_type: 'image',
    });

    // Save to DB
    student.avatar = {
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
    await student.save();

    return res.status(200).json({
      avatar: uploadResult.secure_url,
    });
})

export const uploadPice = asyncHandler(async (req, res, next) => {
    if(req.file){
        if (req.user?.profilePic?.length > 0) {
            await cloudinary.uploader.destroy(req.user.profilePic[0].public_id);
        }
        const { secure_url , public_id } = await cloudinary.uploader.upload(req.file.path , {
            folder: "users",
        })
        console.log(secure_url , public_id);
        console.log(req.user);
        
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id, { profilePic: [{ secure_url, public_id }] }, { new: true });
        return res.status(201).json({ msg:"done", user: updatedUser });
    }else{
        return next(new Error("No file uploaded", { cause: 400 }));
    }
});

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
