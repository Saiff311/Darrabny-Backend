import partnershipModel from "../../DB/models/partnership.model.js";
import collegeModel from "../../DB/models/college.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import asyncHandler from "../../utils/globalErrorHandling.js";
import companyModel from "../../DB/models/company.model.js";

// University: get pending partnership requests directed to this university
export const getPendingPartnerships = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id;
  if (!userId) return next(new Error("Unauthorized", { cause: 401 }));

  const college = await collegeModel.findOne({ collegeAdmin: userId });
  if (!college)
    return next(
      new Error("College not found or access denied", { cause: 403 }),
    );

  const partnerships = await partnershipModel
    .find({ universityId: college._id, status: "pending" })
    .populate("companyId", "companyName logo")
    .lean();

  const enriched = await Promise.all(
    partnerships.map(async (p) => {
      const company = p.companyId || null;
      const availableInternships = company
        ? await internshipModel
          .find({ companyId: company._id, deletedAt: { $exists: false } })
          .select("internshipTitle startDate endDate status")
          .lean()
        : [];

      return {
        ...p,
        company,
        availableInternships,
      };
    }),
  );

  return res.status(200).json({ success: true, data: enriched });
});

// University: accept or reject a partnership request
export const respondToPartnership = asyncHandler(async (req, res, next) => {
  const { partnershipId, action } = req.body;
  const userId = req.user?._id;

  if (!partnershipId || !action)
    return next(
      new Error("partnershipId and action are required", { cause: 400 }),
    );
  if (!["accept", "reject"].includes(action))
    return next(new Error("Invalid action", { cause: 400 }));

  const college = await collegeModel.findOne({ collegeAdmin: userId });
  if (!college)
    return next(
      new Error("College not found or access denied", { cause: 403 }),
    );

  const newStatus = action === "accept" ? "active" : "rejected";

  const updated = await partnershipModel.findOneAndUpdate(
    { _id: partnershipId, universityId: college._id },
    { status: newStatus },
    { new: true },
  );

  if (!updated)
    return next(
      new Error("Partnership not found or cannot be updated", { cause: 404 }),
    );

  return res
    .status(200)
    .json({
      success: true,
      message: `Partnership ${newStatus}`,
      data: updated,
    });
});

export default {
  getPendingPartnerships,
  respondToPartnership,
};
