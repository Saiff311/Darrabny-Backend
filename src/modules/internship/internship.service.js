import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { emailEvent } from "../../services/sendEmail/email.event.js";
import { escapeRegex } from "../../utils/security/escapeRegax.js";
import userModel from "../../DB/models/user.model.js";
import studentModel from "../../DB/models/student.model.js";
import { internshipStatus } from "../../utils/enums.js";

// ========================== Add Internship ==========================
export const addInternship = asyncHandler(async (req, res, next) => {
  const company = req.company;

  if (!company) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  // Company must be approved
  if (!company.approvedByAdmin) {
    return next(
      new Error("Company is not approved by admin yet", { cause: 403 }),
    );
  }

  // Company must not be deleted or banned
  if (company.deletedAt || company.bannedAt) {
    return next(new Error("Company is deleted or banned", { cause: 403 }));
  }

  // Create internship
  const internship = await internshipModel.create({
    ...req.body,
    addedBy: company._id,
  });

  return res.status(201).json({
    success: true,
    message: "Internship added successfully",
    data: internship,
  });
});

// ========================== Update Internship ==========================
export const updateInternship = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  req.body.updatedBy = req.user._id;

  const internship = await internshipModel.findOneAndUpdate(
    { _id: internshipId, addedBy: req.user._id },
    req.body,
    { new: true },
  );

  if (!internship) {
    return next(new Error("internship not found", { cause: 404 }));
  }

  return res.status(201).json({
    success: true,
    message: "internship updated successfully",
    data: internship,
  });
});

// ========================== Delete Internship ==========================
export const deleteInternship = asyncHandler(async (req, res, next) => {
  const { internshipId, companyId } = req.params;

  const company = await companyModel.findById(companyId);
  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  const internship = await internshipModel.findById(internshipId);
  if (!internship) {
    return next(new Error("internship not found", { cause: 404 }));
  }

  // Authorization check
  if (
    company.createdBy.toString() !== req.user._id.toString() &&
    !company.HRs.includes(req.user._id)
  ) {
    return next(
      new Error("You are not authorized to delete internship", { cause: 403 }),
    );
  }

  if (company._id.toString() != internship.companyId.toString()) {
    return next(
      new Error("You are not authorized to delete internship", { cause: 403 }),
    );
  }

  await internship.deleteOne();

  return res.status(201).json({
    success: true,
    message: "internship deleted successfully",
  });
});

// ========================== Get Company Internships ==========================
export const getCompanyInternships = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { page = 1, limit = 6, sort = "-createdAt", companyName } = req.query;
  const skip = (page - 1) * limit;

  let query = { companyId };

  // Get saved internships for user
  const user = await userModel
    .findById(req.user._id)
    .select("savedInternships");
  const savedInternshipsIds = user?.savedInternships || [];

  // Search by company name
  if (companyName) {
    const company = await companyModel.findOne({
      companyName: { $regex: escapeRegex(companyName), $options: "i" },
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    query.companyId = company._id;
  }

  const internships = await internshipModel
    .find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("companyId", "companyName")
    .aggregate([
      {
        $addFields: {
          isSaved: { $in: ["$_id", savedInternshipsIds] },
        },
      },
    ]);

  const totalCount = await internshipModel.countDocuments(query);

  if (internships.length === 0) {
    return next(new Error("No internships found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "internships fetched successfully",
    data: internships,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

// ========================== Get Internship By ID ==========================
export const getInternshipById = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;

  // Get saved internships for user
  const user = await userModel
    .findById(req.user._id)
    .select("savedInternships");
  const savedInternshipsIds = user?.savedInternships || [];

  const internship = await internshipModel
    .findById(internshipId)
    .populate("companyId", "companyName")
    .aggregate([
      {
        $addFields: {
          isSaved: { $in: ["$_id", savedInternshipsIds] },
        },
      },
    ]);

  if (!internship) {
    return next(new Error("internship not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "internship fetched successfully",
    data: internship,
  });
});

// ========================== Get Filtered Internships ==========================
export const getFilteredInternships = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 6, sort = "-createdAt", ...filters } = req.query;
  const skip = (page - 1) * limit;

  // Get saved internships for user
  const user = await userModel
    .findById(req.user._id)
    .select("savedInternships");
  const savedInternshipsIds = user?.savedInternships || [];

  const internships = await internshipModel
    .find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("companyId", "companyName")
    .aggregate([
      {
        $addFields: {
          isSaved: { $in: ["$_id", savedInternshipsIds] },
        },
      },
    ]);

  const totalCount = await internshipModel.countDocuments(filters);

  if (internships.length === 0) {
    return next(new Error("No internships found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "internships fetched successfully",
    data: internships,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

// ========================== Get Internship Applications ==========================
export const getInternshipApp = asyncHandler(async (req, res, next) => {
  const { internshipId } = req.params;
  const { page = 1, limit = 5, sort = "-createdAt" } = req.query;
  const skip = (page - 1) * limit;

  let internship = await internshipModel.findById(internshipId);

  if (!internship) {
    return next(new Error("internship not found", { cause: 404 }));
  }

  const company = await companyModel.findById(internship.companyId);

  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  // Authorization check
  if (
    company.createdBy.toString() !== req.user._id.toString() &&
    !company.HRs.includes(req.user._id)
  ) {
    return next(
      new Error("You are not authorized to perform this action", {
        cause: 403,
      }),
    );
  }

  internship = internship.populate([
    {
      path: "application",
      options: { sort, skip, limit },
      populate: {
        path: "userId",
        select: "username email",
      },
    },
  ]);

  const totalCount = await applicationModel.countDocuments({
    internshipId: internship._id,
  });

  if (internship.application.length === 0) {
    return next(new Error("No applications found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    message: "Applications fetched successfully",
    data: internship,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    },
  });
});

// ========================== Apply To Internship ==========================
export const ApplyToInternship = asyncHandler(async (req, res, next) => {
  const internshipId = req.params.id || req.params.internshipId;
  const { coverLetter, skills } = req.body;

  const internship = await internshipModel
    .findById(internshipId)
    .select("status closed addedBy title");

  if (!internship) {
    return next(new Error("internship not found", { cause: 404 }));
  }

  // Check internship availability
  const isOpen = internship.status
    ? ["active", "starting_soon"].includes(internship.status)
    : !internship.closed;

  if (!isOpen) {
    return next(
      new Error("internship not open for applications", { cause: 409 }),
    );
  }

  // Prevent duplicate applications
  const alreadyApplied = await applicationModel.exists({
    internshipId,
    userId: req.user._id,
  });

  if (alreadyApplied) {
    return next(
      new Error("You have already applied for this internship", { cause: 409 }),
    );
  }

  // Get student data
  const student = await studentModel
    .findOne({ userId: req.user._id })
    .select("fullName email university skills resume");

  if (!student) {
    return next(new Error("student not found", { cause: 404 }));
  }

  // CV is required
  if (!student.resume?.secure_url || !student.resume?.public_id) {
    return next(
      new Error("resume is required. please upload resume first", {
        cause: 400,
      }),
    );
  }

  // Prepare skills array
  let skillsArr = [];
  if (Array.isArray(skills)) {
    skillsArr = skills;
  } else if (typeof skills === "string" && skills.trim()) {
    try {
      const parsed = JSON.parse(skills);
      skillsArr = Array.isArray(parsed) ? parsed : [];
    } catch {
      skillsArr = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  } else {
    skillsArr = Array.isArray(student.skills) ? student.skills : [];
  }

  // Create application snapshot
  try {
    const application = await applicationModel.create({
      internshipId,
      userId: req.user._id,
      status: "pending",
      coverLetter: coverLetter?.trim() || null,
      skills: skillsArr,
      resume: {
        secure_url: student.resume.secure_url,
        public_id: student.resume.public_id,
      },
      snapshot: {
        studentName: student.fullName,
        email: student.email,
        university: student.university,
        skills: skillsArr,
        resumeUrl: student.resume.secure_url,
      },
    });

    return res.status(201).json({
      message: "Application submitted successfully",
      applicationId: application._id,
    });
  } catch (err) {
    if (err?.code === 11000) {
      return next(
        new Error("You have already applied for this internship", {
          cause: 409,
        }),
      );
    }
    throw err;
  }
});

// ========================== Response To Application ==========================
export const responseApp = asyncHandler(async (req, res, next) => {
  const { appId } = req.params;
  const { status } = req.body;

  const application = await applicationModel.findById(appId);

  if (!application) {
    return next(new Error("Application not found", { cause: 404 }));
  }

  if (application.status !== "pending") {
    return next(new Error("Application already responded", { cause: 403 }));
  }

  await application.populate([
    { path: "userId" },
    {
      path: "internshipId",
      populate: { path: "companyId" },
    },
  ]);

  // Authorization check
  if (
    application.internshipId.companyId.createdBy.toString() !==
      req.user._id.toString() &&
    !application.internshipId.companyId.HRs.includes(req.user._id)
  ) {
    return next(
      new Error("You are not authorized to perform this action", {
        cause: 403,
      }),
    );
  }

  application.status = status;
  await application.save();

  emailEvent.on("sendApplicationStatus", application.userId.email, status);

  return res.status(200).json({
    success: true,
    message: "Application responded successfully",
    data: application,
  });
});

export const getStudentInternships = asyncHandler(async (req, res, next) => {
  const studentId = req.user._id;
  const { status, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // filter by internship status (inProgress, completed)
  const today = new Date();
  let statusFilter = {};
  if (status === internshipStatus.inProgress) {
    statusFilter.endDate = { $gte: today };
  } else if (status === internshipStatus.completed) {
    statusFilter.endDate = { $lt: today };
  }

  // Get internshipIds from applications of the student
  const applications = await applicationModel
    .find({ userId: studentId })
    .select("internshipId")
    .lean();

  const internshipIds = applications.map((app) => app.internshipId);

  const totalCount = await internshipModel.countDocuments({
    _id: { $in: internshipIds },
    ...statusFilter,
  });

  const internships = await internshipModel
    .find({ _id: { $in: internshipIds }, ...statusFilter })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("companyId", "companyName")
    .lean();

  const msPerDay = 24 * 60 * 60 * 1000;

  //internship progress calculation
  const data = internships.map((internship) => {
    const start = new Date(internship.startDate);
    const end = new Date(internship.endDate);

    const totalWeeks = Math.ceil((end - start) / msPerDay / 7);
    const currentWeek = Math.min(
      Math.ceil((today - start) / msPerDay / 7),
      totalWeeks
    );
    const progress = Math.round((currentWeek / totalWeeks) * 100);

    return {
      id: internship._id,
      title: internship.internshipTittle,
      company: {
        id: internship.companyId._id,
        name: internship.companyId.companyName,
      },
      location: internship.internshipLocation,
      thumbnail: internship.thumbnail || "",
      startDate: internship.startDate,
      currentWeek,
      totalWeeks,
      progress,
      status:
        internship.endDate >= today
          ? internshipProgressStatus.inProgress
          : internshipProgressStatus.completed,
    };
  });

  return res.status(200).json({
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: totalCount,
    },
  });
});