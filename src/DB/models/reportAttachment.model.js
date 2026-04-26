import mongoose from "mongoose";

const reportAttachmentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "report",
      required: true,
      index: true,
    },

    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true, // stored in bytes
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },

  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only createdAt needed
  }
);

export default mongoose.model("reportAttachment", reportAttachmentSchema);