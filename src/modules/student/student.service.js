import { asyncHandler } from "../../utils/globalErrorHandling.js";
import cloudinary from "../../utils/cloudinary.js";
import userModel from "../../DB/models/user.model.js";
import { compare } from "../../utils/security/hashing.js";
import { decrypt } from "../../utils/security/encryption.js";
import studentModel from "../../DB/models/student.model.js";
import internshipReportModel from "../../DB/models/internshipReport.model.js";
import applicationModel from "../../DB/models/application.model.js";

const formatDuration = (startDate, endDate, durationInMonths) => {
  if (typeof durationInMonths === "number" && durationInMonths > 0) {
    return `${durationInMonths} months`;
  }

  if (!startDate) return null;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (months <= 0) months = 1;

  return `${months} months`;
};

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

  const student = await studentModel
    .findOne({ userId: req.user._id })
    .select("badges")
    .lean();

  user.mobileNumber = await decrypt(user.mobileNumber);

  return res.status(200).json({
    msg: "My Profile",
    user,
    badges: student?.badges || [],
  });
});

// ========================== Get Student Profile Pic ==========================
export const getProfilePic = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;

  if (!userId) {
    return next(new Error("Authentication required", { cause: 401 }));
  }

  const user = await userModel
    .findById(userId)
    .select("profilePic")
    .lean();

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    data: {
      profilePic: user.profilePic?.secure_url || null,
    },
  });
});

// ========================== Student Profile ==========================
export const getStudentProfile = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;

  const student = await studentModel
    .findById(studentId)
    .populate({
      path: "userId",
      select: "firstName lastName skills",
    })
    .populate({
      path: "collegeId",
      select: "collegeName",
    })
    .lean();

  if (!student) return next(new Error("Student not found", { cause: 404 }));

  const user = student.userId || {};
  const college = student.collegeId || {};
  const userId = user?._id || student.userId;

  const applications = await applicationModel
    .find({ userId })
    .populate({
      path: "internshipId",
      select:
        "internshipTitle startDate endDate durationInMonths internshipLocation companyId",
      populate: {
        path: "companyId",
        select: "companyName address",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const professionalExperience = (applications || [])
    .map((application) => {
      const internship = application.internshipId;
      if (!internship) return null;

      const company = internship.companyId || {};
      const startDate = internship.startDate || null;
      const endDate = internship.endDate || null;
      const roleTitle =
        internship.internshipTitle ||
        internship.internshipTitle ||
        internship.title ||
        null;

      return {
        companyName: company.companyName || null,
        role: roleTitle,
        startDate,
        endDate: endDate || null,
        duration: formatDuration(
          startDate,
          endDate,
          internship.durationInMonths,
        ),
        location: company.address || internship.internshipLocation || null,
        status: endDate && now > new Date(endDate) ? "Completed" : "Ongoing",
      };
    })
    .filter(Boolean);

  const reports = await internshipReportModel
    .find({ studentId, overallRating: { $ne: null } })
    .populate({
      path: "reviewedBy",
      select: "companyName",
    })
    .populate({
      path: "internshipId",
      select: "companyId",
      populate: {
        path: "companyId",
        select: "companyName",
      },
    })
    .sort({ createdAt: -1 })
    .lean();

  const companyEvaluations = (reports || []).map((report) => {
    const company =
      report.reviewedBy || report.internshipId?.companyId || {};

    return {
      companyName: company.companyName || null,
      reviewerName: company.companyName || null,
      reviewerRole: "Company",
      rating: report.overallRating,
      reviewText:
        report.internalNote ||
        report.learningOutcomes ||
        report.keyAchievements ||
        report.challengesFaced ||
        null,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      basicInfo: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        major: student.major || null,
        university: college.collegeName || null,
        graduationYear:
          student.graduation_year !== undefined && student.graduation_year !== null
            ? String(student.graduation_year)
            : null,
        gpa:
          student.CGPA !== undefined && student.CGPA !== null
            ? String(student.CGPA)
            : null,
        cvUrl: student.resume?.secure_url || null,
      },
      coreCompetencies: user.skills || [],
      academicRecord: {
        institution: college.collegeName || null,
        major: student.major || null,
        expectedGraduation:
          student.graduation_year !== undefined && student.graduation_year !== null
            ? String(student.graduation_year)
            : null,
      },
      professionalExperience,
      companyEvaluations,
    },
  });
});

// ========================== Student Reviews ==========================
export const getStudentReviews = asyncHandler(async (req, res, next) => {
  const { studentId } = req.params;
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;

  const safePage = page > 0 ? page : 1;
  const safeLimit = limit > 0 ? limit : 10;

  const student = await studentModel
    .findById(studentId)
    .select("points badges certificates");

  if (!student) return next(new Error("Student not found", { cause: 404 }));

  const filterQuery = { studentId, overallRating: { $ne: null } };
  const skip = (safePage - 1) * safeLimit;

  const [reports, totalCount] = await Promise.all([
    internshipReportModel
      .find(filterQuery)
      .populate({
        path: "internshipId",
        select: "title companyId",
        populate: {
          path: "companyId",
          select: "companyName logo",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    internshipReportModel.countDocuments(filterQuery),
  ]);

  const certificateByInternship = new Map();
  for (const certificate of student.certificates || []) {
    if (!certificate?.internshipId || !certificate?.url) continue;
    const key = certificate.internshipId.toString();
    const existing = certificateByInternship.get(key);
    if (!existing || (certificate.date && existing.date < certificate.date)) {
      certificateByInternship.set(key, {
        url: certificate.url,
        date: certificate.date || 0,
      });
    }
  }

  const reviews = reports.map((report) => {
    const internship = report.internshipId;
    const company = internship?.companyId;
    const internshipKey = internship?._id?.toString() || report.internshipId?.toString();
    const certificateUrl = certificateByInternship.get(internshipKey)?.url || null;

    return {
      reportId: report._id,
      internshipTitle: internship?.title || report.title || null,
      companyName: company?.companyName || null,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      overallRating: report.overallRating,
      detailedScores: {
        technicalSkill: report.technicalSkillScore,
        problemSolving: report.problemSolvingScore,
        communication: report.communicationScore,
        initiative: report.initiativeScore,
      },
      feedback: report.internalNote || null,
      certificateUrl,
    };
  });

  return res.status(200).json({
    success: true,
    message: "Student reviews fetched successfully",
    gamification: {
      points: student.points || 0,
      badges: student.badges || [],
      certificates: student.certificates || [],
    },
    pagination: {
      currentPage: safePage,
      totalPages: Math.ceil(totalCount / safeLimit),
      totalCount,
    },
    reviews,
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
export const UploadCoverPic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id)
  //delete old profile pic
  if (user.coverPic.public_id) {
    await cloudinary.uploader.destroy(user.coverPic.public_id)
  }
  //upload profile pic to cloudinary
  const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
    folder: "cover pics"
  })
  const coverPic = { secure_url, public_id }
  await userModel.updateOne({ _id: req.user._id }, { coverPic })
  return res.status(200).json({ msg: "Cover Pic uploaded successfully" })
})

// ========================== Delete Profile Pic ==========================
export const deleteProfilePic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id)
  if (!user.profilePic.public_id) {
    return next(new Error("Profile picture not found!", { cause: 404 }));
  }
  // Delete the image from Cloudinary
  const result = await cloudinary.uploader.destroy(user.profilePic.public_id);
  if (result.result !== "ok") {
    return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
  }
  await userModel.updateOne({ _id: req.user._id }, { $unset: { profilePic: "" } })
  return res.status(200).json({ msg: "Profile Pic deleted successfully" })
})


// ========================== Delete Cover Pic ==========================
export const deleteCoverPic = asyncHandler(async (req, res, next) => {
  const user = await userModel.findById(req.user._id)
  if (!user.coverPic.public_id) {
    return next(new Error("Cover picture not found!", { cause: 404 }));
  }
  // Delete the image from Cloudinary
  const result = await cloudinary.uploader.destroy(user.coverPic.public_id);
  if (result.result !== "ok") {
    return next(new Error("Failed to delete image from Cloudinary", { cause: 500 }));
  }
  await userModel.updateOne({ _id: req.user._id }, { $unset: { coverPic: "" } })
  return res.status(200).json({ msg: "Cover Pic deleted successfully" })
})
// export const saveInternship = asyncHandler(async(req,res,next)=>{})