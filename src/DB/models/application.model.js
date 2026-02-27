import mongoose from "mongoose";
import { appStatus } from "../../utils/enums.js";

const applicationSchema = new mongoose.Schema({
  internshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "internship",
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },

  status: {
    type: String,
    enum: Object.values(appStatus),
    default: appStatus.pending,
  },

  coverLetter: {
    type: String,
    default: null,
  },

  skills: {
    type: [String],
    default: [],
  },

  resume: {
    secure_url: String,
    public_id: String,
  },

  snapshot: {
    studentName: String,
    email: String,
    university: String,
    skills: [String],
    resumeUrl: String,
  },
});

const applicationModel = mongoose.model("application", applicationSchema);
export default applicationModel;
