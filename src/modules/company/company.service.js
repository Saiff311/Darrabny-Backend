import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import collegeModel from "../../DB/models/college.model.js";
import internshipApprovalModel from "../../DB/models/internshipApproval.model.js";
import { internshipAssignmentModel } from "../../DB/models/InternshipAssignment.model.js";
import companyReviewModel from "../../DB/models/companyReview.model.js";
import cloudinary from "../../utils/cloudinary.js";
import { roles } from "../../utils/enums.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ========================== Add Company ==========================
export const addCompany = asyncHandler(async (req, res, next) => {
  const { companyName, companyEmail } = req.body;

  // Check duplicate name/email
  if (
    await companyModel.findOne({ $or: [{ companyName }, { companyEmail }] })
  ) {
    return next(
      new Error("Company email or name already exists!", { cause: 409 }),
    );
  }

  req.body.createdBy = req.user._id;
  req.body.numberOfEmployees = JSON.parse(req.body.numberOfEmployees);

  // Upload legal attachment
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "company-attachments",
    },
  );
  req.body.legalAttachment = { secure_url, public_id };

  const newCompany = await companyModel.create(req.body);

  return res.json({ msg: "Company added successfully", newCompany });
});

// ========================== Update Company ==========================
export const updateCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { companyName, companyEmail } = req.body;

  // Find owned company
  const company = await companyModel.findById({
    _id: companyId,
    createdBy: req.user._id,
    deletedAt: { $exists: false },
  });

  if (!company) return next(new Error("Company not found!", { cause: 404 }));
  if (company.bannedAt)
    return next(new Error("Company is banned", { cause: 403 }));

  // Check unique email
  if (companyEmail && companyEmail !== company.companyEmail) {
    if (await companyModel.findOne({ companyEmail }))
      return next(new Error("Email exists!", { cause: 409 }));
  }

  // Check unique name
  if (companyName && companyName !== company.companyName) {
    if (await companyModel.findOne({ companyName }))
      return next(new Error("Name exists!", { cause: 409 }));
  }

  Object.assign(company, req.body);
  await company.save();

  return res.json({ msg: "Company updated successfully", company });
});

// ========================== Soft Delete Company ==========================
export const softDeleteCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find company (not deleted)
  const company = await companyModel.findById({
    _id: companyId,
    deletedAt: { $exists: false },
  });
  if (!company) return next(new Error("Company not found", { cause: 404 }));

  // Allow admin or owner
  if (
    req.user.role !== roles.admin &&
    req.user._id.toString() !== company.createdBy.toString()
  ) {
    return next(new Error("Not authorized", { cause: 403 }));
  }

  company.deletedAt = new Date();
  await company.save();

  return res.json({ msg: "Company deleted successfully", company });
});

// ========================== Get Company By ID ==========================
export const getCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // 1. Get company basic info (no populate)
  const company = await companyModel.findOne({
    _id: companyId,
    deletedAt: { $exists: false },
  }).select(
    "companyName description industry address logo coverPic rating totalReviews numberOfEmployees createdAt"
  );

  if (!company) {
    return next(new Error("Company not found!", { cause: 404 }));
  }

  // 2. Pagination for internships
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // 3. Get active internships
  const internships = await internshipModel
    .find({
      companyId,
      deletedAt: { $exists: false },
    })
    .select("internshipTittle location internshipType createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // 4. Count stats
  const activeInternshipsCount = await internshipModel.countDocuments({
    companyId,
    deletedAt: { $exists: false },
  });

  const totalInternshipsCount = await internshipModel.countDocuments({
    companyId,
  });

  // 5. Response (clean & frontend-ready)
  return res.status(200).json({
    success: true,
    msg: "Company fetched successfully",
    company: {
      ...company.toObject(),
      stats: {
        activeInternships: activeInternshipsCount,
        totalInternships: totalInternshipsCount,
        rating: company.rating,
        totalReviews: company.totalReviews,
      },
    },
    internships,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(activeInternshipsCount / limit),
      totalItems: activeInternshipsCount,
    },
  });
});

// ========================== Search Company By Name ==========================
export const getCompanyByName = asyncHandler(async (req, res, next) => {
  const { name } = req.query;

  const company = await companyModel.find({
    companyName: { $regex: name, $options: "i" },
    deletedAt: { $exists: false },
  });

  if (!company || company.length === 0)
    return next(new Error("Company not found!", { cause: 404 }));

  return res.json({ msg: "Company fetched successfully", company });
});

// ========================== Upload Company Logo ==========================
export const uploadCompanyLogo = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find owned company
  const company = await companyModel.findOne({
    _id: companyId,
    createdBy: req.user._id,
    deletedAt: { $exists: false },
  });
  if (!company) return next(new Error("Company not found!", { cause: 404 }));
  if (company.bannedAt)
    return next(new Error("Company is banned!", { cause: 403 }));

  // Delete old logo
  if (company.logo.public_id)
    await cloudinary.uploader.destroy(company.logo.public_id);

  // Upload new logo
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: "logo pics" },
  );
  const logo = { secure_url, public_id };

  await companyModel.updateOne({ _id: companyId }, { logo });
  return res.status(200).json({ msg: "Logo uploaded successfully" });
});

// ========================== Upload Company Cover ==========================
export const UploadCompanyCover = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find owned company
  const company = await companyModel.findOne({
    _id: companyId,
    createdBy: req.user._id,
    deletedAt: { $exists: false },
  });
  if (!company) return next(new Error("Company not found!", { cause: 404 }));
  if (company.bannedAt)
    return next(new Error("Company is banned!", { cause: 403 }));

  // Delete old cover
  if (company.coverPic.public_id)
    await cloudinary.uploader.destroy(company.coverPic.public_id);

  // Upload new cover
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    { folder: "coverCompany pics" },
  );
  const coverPic = { secure_url, public_id };

  await companyModel.updateOne({ _id: companyId }, { coverPic });
  return res.status(200).json({ msg: "Cover uploaded successfully" });
});

// ========================== Delete Company Logo ==========================
export const deleteCompanyLogo = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find owned company
  const company = await companyModel.findOne({
    _id: companyId,
    createdBy: req.user._id,
    deletedAt: { $exists: false },
  });
  if (!company) return next(new Error("Company not found!", { cause: 404 }));
  if (company.bannedAt)
    return next(new Error("Company is banned!", { cause: 403 }));

  if (company.logo.public_id)
    await cloudinary.uploader.destroy(company.logo.public_id);
  await companyModel.updateOne({ _id: companyId }, { $unset: { logo: "" } });

  return res.status(200).json({ msg: "Logo deleted successfully" });
});

// ========================== Delete Company Cover ==========================
export const deleteCompanyCover = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;

  // Find owned company
  const company = await companyModel.findOne({
    _id: companyId,
    createdBy: req.user._id,
    deletedAt: { $exists: false },
  });
  if (!company) return next(new Error("Company not found!", { cause: 404 }));
  if (company.bannedAt)
    return next(new Error("Company is banned!", { cause: 403 }));

  if (company.coverPic.public_id)
    await cloudinary.uploader.destroy(company.coverPic.public_id);
  await companyModel.updateOne(
    { _id: companyId },
    { $unset: { coverPic: "" } },
  );

  return res.status(200).json({ msg: "Cover deleted successfully" });
});

// ========================== Company Signup ==========================
export const companySignup = asyncHandler(async (req, res, next) => {
  const {
    companyName,
    email,
    companyPhone,
    password,
    confirmPassword,
    description,
    industry,
    address,
    numberOfEmployees,
  } = req.body;

  // duplicate check
  const companyExist = await companyModel.findOne({
    $or: [{ email }, { companyName }, { companyPhone }],
  });

  if (companyExist) {
    return next(
      new Error("Company email, phone, or name already exists!", {
        cause: 409,
      }),
    );
  }

  delete req.body.confirmPassword;
  console.log(req.body);

  const newCompany = await companyModel.create({
    companyName,
    email,
    companyPhone,
    password,
    description,
    industry,
    address,
    numberOfEmployees,
  });

  return res.status(200).json({
    msg: "Company registered successfully",
    company: newCompany,
  });
});

// ========================== Company Login ==========================
export const companyLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find company (not deleted)
  const company = await companyModel.findOne({
    email,
    deletedAt: { $exists: false },
  });

  if (!company)
    return next(new Error("Invalid email or password", { cause: 401 }));

  // Check password
  const isMatch = await bcrypt.compare(password, company.password);

  if (!isMatch)
    return next(new Error("Invalid email or password", { cause: 401 }));

  // Generate token
  const token = jwt.sign(
    { id: company._id, role: "company" },
    process.env.COMPANY_SECRET_KEY,
    { expiresIn: "7d" },
  );

  return res.status(200).json({ msg: "Login successful", company, token });
});



// ========================== Send Endorsement Request ==========================
export const sendEndorsementRequest = asyncHandler(async (req, res, next) => {
  const companyId = req.company?._id;
  const { internshipId, universityId } = req.body;

  if (!companyId) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  const internship = await internshipModel.findOne({
    _id: internshipId,
    companyId,
    deletedAt: { $exists: false },
  });

  if (!internship) {
    return next(
      new Error("Internship not found or not owned by this company", {
        cause: 404,
      }),
    );
  }

  const university = await collegeModel.findOne({
    _id: universityId,
    deletedAt: { $exists: false },
  });

  if (!university) {
    return next(new Error("University not found", { cause: 404 }));
  }

  const existingRequest = await internshipApprovalModel.findOne({
    internshipId,
    universityId,
  });

  if (existingRequest) {
    return next(
      new Error("Endorsement request already exists for this internship and university", {
        cause: 409,
      }),
    );
  }

  const approval = await internshipApprovalModel.create({
    internshipId,
    companyId,
    universityId,
    status: "pending",
  });

  return res.status(201).json({
    success: true,
    message: "Endorsement request sent successfully",
    data: approval,
  });
});



// ========================== Get Company Applications ==========================
export const getCompanyApplications = asyncHandler(async (req, res, next) => {
  const companyId = req.company;

  const {
    status = "pending",
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  // Get company internships
  const internships = await internshipModel
    .find({ companyId })
    .select("_id internshipTittle");

  const internshipIds = internships.map((i) => i._id);

  const filter = { internshipId: { $in: internshipIds } };

  if (status !== "all") {
    filter.status = status;
  }

  const sortOption = sort === "newest" ? { createdAt: -1 } : { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const applications = await applicationModel
    .find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(Number(limit))
    .populate("internshipId", "internshipTittle")
    .populate("userId", "fullName email university");

  const totalItems = await applicationModel.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limit);

  const data = applications.map((app) => ({
    applicationId: app._id,
    internship: {
      id: app.internshipId?._id,
      title: app.internshipId?.internshipTittle,
    },
    student: {
      id: app.userId?._id,
      fullName: app.userId?.fullName,
      email: app.userId?.email,
      university: app.userId?.university,
    },
    skills: app.skills,
    status: app.status,
    appliedAt: app.createdAt,
  }));

  res.status(200).json({
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages,
    },
  });
});

// ========================== Display Company Verification ==========================
export const companyVerification = asyncHandler(async (req, res, next) => {
  const companyId = req.company;
  const company = await companyModel.findById(companyId);
  return res.status(200).json({
    msg: "Verification details retrieved",
    status: company.verificationStatus,
    validUntil: company.validUntil,
  });
});

// ========================= Company Dashboard ==========================
export const getCompanyDashboard = asyncHandler(async (req, res, next) => {
  const companyId = req.company._id;

  let stats = {
    totalApplicants: 0,
    applicantsGrowth: 0,
    totalCompletedTrainees: 0,
    activePostings: {
      total: 0,
      internships: 0,
    },
    acceptanceRate: 0,
  };

  let ongoingInternships = [];

  let verification = {
    status: "pending",
    validUntil: null,
  };

  // total applicants
  const totalApplicants = await applicationModel.countDocuments({
    company: companyId,
  });
  stats.totalApplicants = totalApplicants;

  // active internships
  const internships = await internshipModel.countDocuments({
    company: companyId,
    status: "inProgress",
  });

  stats.activePostings.internships = internships;
  stats.activePostings.total = internships;

  // completed trainees
  const completed = await internshipAssignmentModel.countDocuments({
    company: companyId,
    status: "completed",
  });

  stats.totalCompletedTrainees = completed;

  try {
    // ongoing interns preview
    ongoingInternships = await internshipAssignmentModel
      .find({
        company: companyId,
        status: { $in: ["onboarding", "in-progress"] },
      })
      .limit(3)
      .populate("student", "name")
      .populate("internship", "title");
  } catch (err) {
    ongoingInternships = [];
  }

  const company = await companyModel
    .findById(companyId)
    .select("verificationStatus");

  if (company) {
    verification = {
      status: company.verificationStatus || "pending",
    };
  }

  return res.status(200).json({
    stats,
    ongoingInternships,
    verification,
  });
});

// ========================= Get Company Settings ==========================
export const getCompanySettings = asyncHandler(async (req, res, next) => {
  const companyId = req.company?._id;

  if (!companyId) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  const company = await companyModel
    .findById(companyId)
    .select("companyName email companyPhone address notifications");

  if (!company) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  return res.status(200).json({
    success: true,
    data: company,
  });
});

// ========================= Update Company Settings ==========================
export const updateCompanySettings = asyncHandler(async (req, res, next) => {
  const companyId = req.company?._id;
  const { companyName, email, companyPhone, address } = req.body;

  if (!companyId) {
    return next(new Error("Company authentication required", { cause: 401 }));
  }

  const currentCompany = await companyModel.findById(companyId);
  if (!currentCompany) {
    return next(new Error("Company not found", { cause: 404 }));
  }

  if (currentCompany.deletedAt || currentCompany.bannedAt) {
    return next(new Error("Company is deleted or banned", { cause: 403 }));
  }

  if (email && email !== currentCompany.email) {
    const emailExists = await companyModel.findOne({
      email,
      _id: { $ne: companyId },
    });
    if (emailExists) {
      return next(new Error("Email already exists", { cause: 409 }));
    }
  }

  if (companyPhone && companyPhone !== currentCompany.companyPhone) {
    const phoneExists = await companyModel.findOne({
      companyPhone,
      _id: { $ne: companyId },
    });
    if (phoneExists) {
      return next(new Error("Phone number already exists", { cause: 409 }));
    }
  }

  if (companyName && companyName !== currentCompany.companyName) {
    const nameExists = await companyModel.findOne({
      companyName,
      _id: { $ne: companyId },
    });
    if (nameExists) {
      return next(new Error("Company name already exists", { cause: 409 }));
    }
  }

  const updates = {};
  if (companyName !== undefined) updates.companyName = companyName;
  if (email !== undefined) updates.email = email;
  if (companyPhone !== undefined) updates.companyPhone = companyPhone;
  if (address !== undefined) updates.address = address;

  const updatedCompany = await companyModel.findByIdAndUpdate(
    companyId,
    updates,
    {
      new: true,
      runValidators: true,
    },
  );

  return res.status(200).json({
    success: true,
    message: "Company settings updated successfully",
    data: updatedCompany,
  });
});

// ========================= Update Notification Preferences ==========================
export const updateNotificationPreferences = asyncHandler(
  async (req, res, next) => {
    const companyId = req.company?._id;
    const { email, push } = req.body;

    if (!companyId) {
      return next(new Error("Company authentication required", { cause: 401 }));
    }

    const updates = {};
    if (email !== undefined) updates["notifications.email"] = email;
    if (push !== undefined) updates["notifications.push"] = push;

    const updatedCompany = await companyModel
      .findByIdAndUpdate(
        companyId,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        },
      )
      .select("companyName notifications");

    if (!updatedCompany) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: updatedCompany,
    });
  },
);

// ========================== Search Companies ==========================
export const searchCompanies = asyncHandler(async (req, res, next) => {
  const {
    q,
    industry,
    location,
    page = 1,
    limit = 10,
    sort = "relevant",
  } = req.query;

  const filter = {
    deletedAt: { $exists: false },
  };

  // search query
  if (q) {
    filter.companyName = { $regex: q, $options: "i" };
  }

  // industry filter
  if (industry) {
    filter.industry = { $regex: industry, $options: "i" };
  }

  // location filter
  if (location) {
    filter.address = { $regex: location, $options: "i" };
  }

  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 };

  if (sort === "popular") {
    sortOption = { rating: -1 };
  }

  const companies = await companyModel
    .find(filter)
    .select(
      "companyName industry address logo rating totalReviews isFeatured",
    )
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const totalItems = await companyModel.countDocuments(filter);

  return res.status(200).json({
    success: true,
    results: companies,
    pagination: {
      page: Number(page),
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  });
});

// ========================== Featured Companies ==========================
export const getFeaturedCompanies = asyncHandler(
  async (req, res, next) => {
    const companies = await companyModel.find({
      deletedAt: { $exists: false },
    });

    const result = await Promise.all(
      companies.map(async (company) => {
        // 1. internships count
        const internshipsCount = await internshipModel.countDocuments({
          companyId: company._id,
          deletedAt: { $exists: false },
        });

        // 2. last activity
        const lastInternship = await internshipModel
          .findOne({ companyId: company._id })
          .sort({ createdAt: -1 });

        const daysSinceLastActivity = lastInternship
          ? (Date.now() - lastInternship.createdAt) /
          (1000 * 60 * 60 * 24)
          : 999;

        const recentActivityScore = Math.max(
          0,
          1 - daysSinceLastActivity / 30,
        );

        // 3. rating normalization (0 → 1 scale)
        const ratingScore = (company.rating || 0) / 5;

        // 4. internships normalization
        const internshipScore = Math.min(
          internshipsCount / 10,
          1,
        );

        // 5. final weighted score
        const score =
          internshipScore * 0.4 +
          ratingScore * 0.3 +
          recentActivityScore * 0.3;

        return {
          id: company._id,
          name: company.companyName,
          logo: company.logo,
          industry: company.industry,
          address: company.address,
          rating: company.rating,
          totalReviews: company.totalReviews,
          score: Number(score.toFixed(2)),
          highlight:
            score > 0.7
              ? "🚀 Top Performing Company"
              : "🔥 Active Hiring Company",
        };
      }),
    );

    // sort by score
    const featured = result
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      featured,
    });
  },
);

// ========================== Get All Companies ==========================
export const getAllCompanies = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    sort = "newest",
  } = req.query;

  const skip = (page - 1) * limit;

  let sortOption = { createdAt: -1 };

  if (sort === "popular") {
    sortOption = { rating: -1 };
  }

  const companies = await companyModel
    .find({
      deletedAt: { $exists: false },
    })
    .select(
      "companyName industry address logo rating totalReviews isFeatured"
    )
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const totalItems = await companyModel.countDocuments({
    deletedAt: { $exists: false },
  });

  return res.status(200).json({
    success: true,
    companies,
    pagination: {
      page: Number(page),
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  });
});

// ========================== Get Company Internships ==========================
export const getCompanyInternships = asyncHandler(
  async (req, res, next) => {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const company = await companyModel.findOne({
      _id: companyId,
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    const skip = (page - 1) * limit;

    const internships = await internshipModel
      .find({
        companyId,
        deletedAt: { $exists: false },
      })
      .select(
        "internshipTittle location internshipType createdAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await internshipModel.countDocuments({
      companyId,
      deletedAt: { $exists: false },
    });

    return res.status(200).json({
      success: true,
      internships,
      pagination: {
        page: Number(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    });
  },
);

// ========================== Add Company Review ==========================
export const addCompanyReview = asyncHandler(
  async (req, res, next) => {
    const { companyId } = req.params;
    const { rating, comment } = req.body;

    // check company exists
    const company = await companyModel.findOne({
      _id: companyId,
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    // prevent duplicate review
    const existingReview = await companyReviewModel.findOne({
      companyId,
      userId: req.user._id,
    });

    if (existingReview) {
      return next(
        new Error("You already reviewed this company", {
          cause: 409,
        })
      );
    }

    // create review
    const review = await companyReviewModel.create({
      companyId,
      userId: req.user._id,
      rating,
      comment,
    });

    // aggregate ratings
    const stats = await companyReviewModel.aggregate([
      {
        $match: {
          companyId: company._id,
        },
      },
      {
        $group: {
          _id: "$companyId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // update company rating
    await companyModel.findByIdAndUpdate(companyId, {
      rating: stats[0]?.averageRating || 0,
      totalReviews: stats[0]?.totalReviews || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  }
);

// ========================== Get Company Reviews ==========================
export const getCompanyReviews = asyncHandler(
  async (req, res, next) => {
    const { companyId } = req.params;

    // check company exists
    const company = await companyModel.findOne({
      _id: companyId,
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    const reviews = await companyReviewModel
      .find({ companyId })
      .populate("userId", "fullName profilePic")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,

      averageRating: company.rating,

      totalReviews: company.totalReviews,

      reviews: reviews.map((review) => ({
        id: review._id,

        user: review.userId,

        rating: review.rating,

        comment: review.comment,

        date: review.createdAt,
      })),
    });
  }
);

// ========================= Get My Company Profile =========================
export const getMyCompanyProfile = asyncHandler(
  async (req, res, next) => {
    const companyId = req.company._id;

    const company = await companyModel
      .findOne({
        _id: companyId,
        deletedAt: { $exists: false },
      })
      .select(
        `
        companyName
        email
        companyPhone
        description
        industry
        address
        logo
        coverPic
        numberOfEmployees
        rating
        totalReviews
        verificationStatus
        createdAt
        `
      );

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    // stats
    const activeInternships = await internshipModel.countDocuments({
      companyId,
      deletedAt: { $exists: false },
    });

    const internships = await internshipModel.find({
      companyId,
    }).select("_id");

    const internshipIds = internships.map(i => i._id);

    const totalApplications = await applicationModel.countDocuments({
      internshipId: { $in: internshipIds },
    });

    return res.status(200).json({
      success: true,
      company,
      stats: {
        activeInternships,
        totalApplications,
      },
    });
  },
);

// ========================= Update My Company Profile =========================
export const updateMyCompanyProfile = asyncHandler(
  async (req, res, next) => {
    const companyId = req.company._id;

    const {
      companyName,
      description,
      industry,
      address,
      companyPhone,
      numberOfEmployees,
    } = req.body;

    const company = await companyModel.findOne({
      _id: companyId,
      deletedAt: { $exists: false },
    });

    if (!company) {
      return next(new Error("Company not found", { cause: 404 }));
    }

    if (company.bannedAt) {
      return next(new Error("Company is banned", { cause: 403 }));
    }

    // unique company name
    if (
      companyName &&
      companyName !== company.companyName
    ) {
      const exists = await companyModel.findOne({
        companyName,
        _id: { $ne: companyId },
      });

      if (exists) {
        return next(
          new Error("Company name already exists", {
            cause: 409,
          }),
        );
      }

      company.companyName = companyName;
    }

    // unique phone
    if (
      companyPhone &&
      companyPhone !== company.companyPhone
    ) {
      const exists = await companyModel.findOne({
        companyPhone,
        _id: { $ne: companyId },
      });

      if (exists) {
        return next(
          new Error("Phone number already exists", {
            cause: 409,
          }),
        );
      }

      company.companyPhone = companyPhone;
    }

    // update optional fields
    if (description !== undefined)
      company.description = description;

    if (industry !== undefined)
      company.industry = industry;

    if (address !== undefined)
      company.address = address;

    if (numberOfEmployees !== undefined)
      company.numberOfEmployees = numberOfEmployees;

    await company.save();

    return res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      company,
    });
  },
);