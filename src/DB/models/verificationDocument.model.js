import mongoose from "mongoose";

const verificationDocumentSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "verification_request",
      required: true,
      index: true,
    },
    documentName: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

verificationDocumentSchema.index({ requestId: 1, status: 1 });

const verificationDocumentModel = mongoose.model(
  "verification_document",
  verificationDocumentSchema,
);

export default verificationDocumentModel;
