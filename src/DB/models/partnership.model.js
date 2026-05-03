import mongoose from "mongoose";

const partnershipSchema = new mongoose.Schema(
  {
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
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const partnershipModel = mongoose.model("partnership", partnershipSchema);

export default partnershipModel;
