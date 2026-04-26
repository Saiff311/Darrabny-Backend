import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";
import studentModel from "../../DB/models/student.model.js";

// ========================== Update Student Account ==========================
export const UpdateStudentAccount = asyncHandler(async (req, res, next) => {
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
    user,
  });
});

// ========================== getLoginStudent ==========================
export const getLoginStudent = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findById(req.user._id)
    .select("-notifications -DOB -provider -isConfirmed -isDeleted -password -otp");

  if (!user) return next(new Error("User not found", { cause: 404 }));

  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({ msg: "My Profile", user });
});

// ========================== Skills ==========================
export const addSkill = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  const { skillName } = req.body;

  if (user.skills.includes(skillName)) {
    return next(new Error("Skill already added", { cause: 400 }));
  }

  user.skills.push(skillName);
  await user.save();

  return res.status(200).json({ msg: "Skill added successfully", skillName });
});

export const getSkills = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  return res
    .status(200)
    .json({ msg: "Skills retrieved successfully", skills: user.skills });
});

export const deleteSkill = asyncHandler(async (req, res, next) => {
  const { skill } = req.body;

  const user = await userModel.findByIdAndUpdate(
    req.user._id,
    { $pull: { skills: skill } },
    { new: true }
  );

  return res
    .status(200)
    .json({ msg: "Skill deleted successfully", userSkills: user.skills });
});

// ========================== Projects ==========================
export const addProject = asyncHandler(async (req, res, next) => {
  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return res.status(404).json({ message: "Student not found" });

  student.projects.push(req.body);
  await student.save();

  return res.status(201).json({
    message: "Project added successfully",
    project: student.projects[student.projects.length - 1],
  });
});

export const getProjects = asyncHandler(async (req, res, next) => {
  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return res.status(404).json({ message: "Student not found" });

  return res.status(201).json({
    message: "Projects retrieved successfully",
    projects: student.projects,
  });
});

export const updateProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const project = student.projects.id(projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (student.userId.toString() !== req.user._id.toString()) {
    return next(
      new Error("You are not authorized to update this project", { cause: 403 })
    );
  }

  Object.assign(project, req.body);
  await student.save();

  return res.status(200).json({
    message: "Project updated successfully",
    project,
  });
});

export const deleteProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return res.status(404).json({ message: "Student not found" });

  const project = student.projects.id(projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (student.userId.toString() !== req.user._id.toString()) {
    return next(
      new Error("You are not authorized to delete this project", { cause: 403 })
    );
  }

  project.deleteOne();
  await student.save();

  return res.status(200).json({ message: "Project deleted successfully" });
});

// ========================== Resume ==========================
export const uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new Error("PDF file is required", { cause: 400 }));

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return next(new Error("Student not found", { cause: 404 }));

  if (student.resume?.public_id) {
    await cloudinary.uploader.destroy(student.resume.public_id, {
      resource_type: "raw",
    });
  }

  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "raw",
    // format: "pdf",
    public_id: `resumes/${Date.now()}.pdf`, // force .pdf in the ID
    overwrite: true,
    access_mode: "public"  
  });

  student.resume = {
    secure_url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
  };
  await student.save();

 const downloadUrl = cloudinary.utils.private_download_url(
  student.resume.public_id,
  "pdf",
  {
    resource_type: "raw",
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiry
  }
);

  return res.status(200).json({
    fileName: req.file.originalname,
    updatedAt: new Date().toISOString().split("T")[0],
    downloadUrl,
  });
});

export const downloadResume = asyncHandler(async (req, res, next) => {
  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return next(new Error("Student not found", { cause: 404 }));

  if (!student.resume?.secure_url) {
    return next(new Error("No resume uploaded yet", { cause: 404 }));
  }

  // Transform the URL to force download with fl_attachment
  const downloadUrl = student.resume.secure_url.replace(
    "/upload/",
    "/upload/fl_attachment/"
  );

  return res.status(200).json({
    downloadUrl,
  });
});

// ========================== Profile Picture ==========================
export const UploadProfilePic = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new Error("Image file is required", { cause: 400 }));

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) return next(new Error("Student not found", { cause: 404 }));

  if (student.avatar?.public_id) {
    await cloudinary.uploader.destroy(student.avatar.public_id);
  }

  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    folder: "avatars",
    resource_type: "image",
  });

  student.avatar = {
    secure_url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
  };
  await student.save();

  return res.status(200).json({ avatar: uploadResult.secure_url });
});

// ========================== uploadPice (profilePic) ==========================
export const uploadPice = asyncHandler(async (req, res, next) => {
  if (req.file) {
    if (req.user?.profilePic?.length > 0) {
      await cloudinary.uploader.destroy(req.user.profilePic[0].public_id);
    }

    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { folder: "users" }
    );

    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { profilePic: [{ secure_url, public_id }] },
      { new: true }
    );

    return res.status(201).json({ msg: "done", user: updatedUser });
  } else {
    return next(new Error("No file uploaded", { cause: 400 }));
  }
});

// ========================== Other User ==========================
export const getAnotherUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const doc = await userModel
    .findById(id)
    .select("firstName lastName mobileNumber profilePic coverPic");

  if (!doc) return res.status(404).json({ msg: "User not found" });

  const user = doc.toObject({ virtuals: true });
  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({ msg: "My Profile", user });
});

// ========================== Update Password ==========================
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!(await compare(oldPassword, req.user.password))) {
    return next(new Error("Invalid old password", { cause: 400 }));
  }

  const user = await userModel.findById(req.user._id);
  user.password = newPassword;
  user.changePassword = Date.now();
  await user.save();

  return res.status(200).json({ msg: "Password updated successfully" });
});

// ========================== Soft Delete ==========================
export const softDelete = asyncHandler(async (req, res, next) => {
  await userModel.updateOne(
    { _id: req.user._id },
    { isDeleted: true, deletedAt: Date.now() }
  );

  return res.status(200).json({ msg: "Account Deleted Successfully" });
});

// ========================== Upload Cover Pic ==========================
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

// ========================== Delete Profile Pic ==========================
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


// ========================== Delete Cover Pic ==========================
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
// export const saveInternship = asyncHandler(async(req,res,next)=>{})