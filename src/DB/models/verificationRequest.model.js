import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { _id: false },
);

const verificationRequestSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "company",
      index: true,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "college",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    validUntil: {
      type: Date,
      default: null,
    },
    history: [historySchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

verificationRequestSchema.virtual("documents", {
  ref: "verification_document",
  localField: "_id",
  foreignField: "requestId",
});

verificationRequestSchema.index({ companyId: 1, status: 1 });
verificationRequestSchema.index({ collegeId: 1, status: 1 });
const verificationRequestModel = mongoose.model(
  "verification_request",
  verificationRequestSchema,
);

export default verificationRequestModel;
