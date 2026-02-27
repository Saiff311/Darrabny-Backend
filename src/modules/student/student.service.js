import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";

// ========================== Update Student Account ==========================
export const UpdateStudentAccount = asyncHandler(async (req, res, next) => {
  // Get data to update
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

  // Update links (linkedin & github)
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

// ========================== Get My Profile ==========================
export const getLoginStudent = asyncHandler(async (req, res, next) => {
  const user = await userModel
    .findById(req.user._id)
    .select("-notifications -DOB -provider -isConfirmed -isDeleted -password -otp");

  // Decrypt mobile number
  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({ msg: "My Profile", user });
});

// ========================== Get Another User ==========================
export const getAnotherUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Select required fields only
  const doc = await userModel
    .findById(id)
    .select("firstName lastName mobileNumber profilePic coverPic");

  if (!doc) {
    return res.status(404).json({ msg: "User not found" });
  }

  // Convert to object to use virtuals (username)
  const user = doc.toObject({ virtuals: true });

  // Decrypt mobile number
  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({ msg: "My Profile", user });
});

// ========================== Update Password ==========================
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  // Check old password
  if (!(await compare(oldPassword, req.user.password))) {
    return next(new Error("Invalid old password", { cause: 400 }));
  }

  // Update password (use save to trigger hashing hook)
  const user = await userModel.findById(req.user._id);
  user.password = newPassword;
  user.changePassword = Date.now();
  await user.save();

  return res.status(200).json({ msg: "Password updated successfully" });
});

// ========================== Upload Profile Picture ==========================
export const UploadProfilePic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  // Delete old profile pic
  if (user.profilePic.public_id) {
    await cloudinary.uploader.destroy(user.profilePic.public_id);
  }

  // Upload new profile pic
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "profile pics",
    },
  );

  const profilePic = { secure_url, public_id };

  await userModel.updateOne({ _id: req.user._id }, { profilePic });

  return res.status(200).json({ msg: "Profile Pic uploaded successfully" });
});

// ========================== Upload Cover Picture ==========================
export const UploadCoverPic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  // Delete old cover pic
  if (user.coverPic.public_id) {
    await cloudinary.uploader.destroy(user.coverPic.public_id);
  }

  // Upload new cover pic
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "cover pics",
    },
  );

  const coverPic = { secure_url, public_id };

  await userModel.updateOne({ _id: req.user._id }, { coverPic });

  return res.status(200).json({ msg: "Cover Pic uploaded successfully" });
});

// ========================== Delete Profile Picture ==========================
export const deleteProfilePic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  if (!user.profilePic.public_id) {
    return next(new Error("Profile picture not found!", { cause: 404 }));
  }

  // Delete image from Cloudinary
  const result = await cloudinary.uploader.destroy(user.profilePic.public_id);

  if (result.result !== "ok") {
    return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
  }

  await userModel.updateOne({ _id: req.user._id }, { $unset: { profilePic: "" } });

  return res.status(200).json({ msg: "Profile Pic deleted successfully" });
});

// ========================== Delete Cover Picture ==========================
export const deleteCoverPic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);

  if (!user.coverPic.public_id) {
    return next(new Error("Cover picture not found!", { cause: 404 }));
  }

  // Delete image from Cloudinary
  const result = await cloudinary.uploader.destroy(user.coverPic.public_id);

  if (result.result !== "ok") {
    return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
  }

  await userModel.updateOne({ _id: req.user._id }, { $unset: { coverPic: "" } });

  return res.status(200).json({ msg: "Cover Pic deleted successfully" });
});

// ========================== Soft Delete Account ==========================
export const softDelete = asyncHandler(async (req, res, next) => {
  await userModel.updateOne(
    { _id: req.user._id },
    { isDeleted: true, deletedAt: Date.now() },
  );

  return res.status(200).json({ msg: "Account Deleted Successfully" });
});

// export const saveInternship = asyncHandler(async(req,res,next)=>{})