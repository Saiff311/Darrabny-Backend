import mongoose from "mongoose";
import { roles } from "../../utils/enums.js";

const reportCommentSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "report",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user", 
    },

    senderRole: {
      type: String,
      required: true,
      enum: Object.values(roles),
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

export default mongoose.model("reportComment", reportCommentSchema);