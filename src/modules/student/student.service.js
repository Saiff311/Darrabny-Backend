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

  // Update name (split first & last)
  if (fullName) {
    const nameParts = fullName.trim().split(" ");
    user.firstName = nameParts.shift();
    user.lastName = nameParts.join(" ");
  }

  // Update about
  if (about) {
    user.about = about;
  }

  // Update links
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
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  student.projects.push(req.body);
  await student.save();

  return res.status(201).json({
    message: "Project added successfully",
    project: student.projects[student.projects.length - 1],
  });
});

export const getProjects = asyncHandler(async (req, res, next) => {
  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  return res.status(201).json({
    message: "Projects retrieved successfully",
    projects: student.projects,
  });
});

export const updateProject = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const project = student.projects.id(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

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
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }

  const project = student.projects.id(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (student.userId.toString() !== req.user._id.toString()) {
    return next(
      new Error("You are not authorized to delete this project", { cause: 403 })
    );
  }

  project.deleteOne();
  await student.save();

  return res.status(200).json({
    message: "Project deleted successfully",
  });
});

// ========================== Resume ==========================
export const uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("PDF file is required", { cause: 400 }));
  }

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  if (student.resume?.public_id) {
    await cloudinary.uploader.destroy(student.resume.public_id, {
      resource_type: "raw",
    });
  }

  const uploadResult = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "raw",
    folder: "resumes",
    format: "pdf",
  });

  student.resume = {
    secure_url: uploadResult.secure_url,
    public_id: uploadResult.public_id,
  };

  await student.save();

  return res.status(200).json({
    fileName: req.file.originalname,
    updatedAt: new Date().toISOString().split("T")[0],
    downloadUrl: uploadResult.secure_url,
  });
});

export const downloadResume = asyncHandler(async (req, res, next) => {
  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

  if (!student.resume?.secure_url) {
    return next(new Error("No resume uploaded yet", { cause: 404 }));
  }

  return res.status(200).json({
    downloadUrl: student.resume.secure_url,
  });
});

// ========================== Profile Picture ==========================
export const UploadProfilePic = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new Error("Image file is required", { cause: 400 }));
  }

  const student = await studentModel.findOne({ userId: req.user._id });
  if (!student) {
    return next(new Error("Student not found", { cause: 404 }));
  }

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

  return res.status(200).json({
    avatar: uploadResult.secure_url,
  });
});

// ========================== Other User ==========================
export const getAnotherUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const doc = await userModel
    .findById(id)
    .select("firstName lastName mobileNumber profilePic coverPic");

  if (!doc) {
    return res.status(404).json({ msg: "User not found" });
  }

  const user = doc.toObject({ virtuals: true });
  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({ msg: "My Profile", user });
});

// ========================== Password ==========================
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

// export const saveInternship = asyncHandler(async(req,res,next)=>{})