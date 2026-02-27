import applicationModel from "../../DB/models/application.model.js";
import companyModel from "../../DB/models/company.model.js";
import internshipModel from "../../DB/models/internship.model.js";
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

  // Get company with active internships
  const company = await companyModel
    .findById({
      _id: companyId,
      deletedAt: { $exists: false },
    })
    .populate({ path: "jobs", match: { deletedAt: { $exists: false } } });

  if (!company) return next(new Error("Company not found!", { cause: 404 }));

  return res.json({ msg: "Company fetched successfully", company });
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
    companyEmail,
    password,
    confirmPassword,
    description,
    industry,
    address,
    numberOfEmployees,
  } = req.body;

  // Check duplicate
  const companyExist = await companyModel.findOne({
    $or: [{ companyName }, { companyEmail }],
  });

  if (companyExist) {
    return next(
      new Error("Company email or name already exists!", { cause: 409 }),
    );
  }

  // Remove confirm password
  delete req.body.confirmPassword;

  const newCompany = await companyModel.create({
    companyName,
    companyEmail,
    password,
    description,
    industry,
    address,
    numberOfEmployees,
  });

  return res.status(201).json({
    msg: "Company registered successfully",
    company: newCompany,
  });
});

// ========================== Company Login ==========================
export const companyLogin = asyncHandler(async (req, res, next) => {
  const { companyEmail, password } = req.body;

  // Find company (not deleted)
  const company = await companyModel.findOne({
    companyEmail,
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

// ========================== Get Company Applications ==========================
export const getCompanyApplications = asyncHandler(async (req, res, next) => {
  const companyId = req.company;

  const { status = "pending", page = 1, limit = 10, sort = "newest" } = req.query;

  // Get company internships
  const internships = await internshipModel
    .find({ companyId })
    .select("_id internshipTittle");

  const internshipIds = internships.map(i => i._id);

  const filter = { internshipId: { $in: internshipIds } };

  if (status !== "all") {
    filter.status = status;
  }

  const sortOption =
    sort === "newest"
      ? { createdAt: -1 }
      : { createdAt: -1 };

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

  const data = applications.map(app => ({
    applicationId: app._id,
    internship: {
      id: app.internshipId?._id,
      title: app.internshipId?.internshipTittle
    },
    student: {
      id: app.userId?._id,
      fullName: app.userId?.fullName,
      email: app.userId?.email,
      university: app.userId?.university
    },
    skills: app.skills,
    status: app.status,
    appliedAt: app.createdAt
  }));

  res.status(200).json({
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      totalItems,
      totalPages
    }
  });
});