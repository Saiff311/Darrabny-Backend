import mongoose from "mongoose";

const internshipApprovalSchema = new mongoose.Schema(
  {
    internshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "internship",
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      required: true,
      index: true,
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "college",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

internshipApprovalSchema.index(
  { internshipId: 1, universityId: 1 },
  { unique: true },
);

const internshipApprovalModel = mongoose.model(
  "internship_approval",
  internshipApprovalSchema,
);

export default internshipApprovalModel;
