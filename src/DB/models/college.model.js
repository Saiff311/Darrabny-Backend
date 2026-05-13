import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { roles } from "../../utils/enums.js";

const collegeSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: true,
      unique: true,
      minLength: 2,
      trim: true,
    },
    collegeEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    role: {
      type: String,
      default: roles.collegeAdmin,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    departments: [
      {
        name: { type: String, trim: true, required: true },
        head: { type: String, trim: true, required: true },
      },
    ],
    address: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      secure_url: { type: String, default: "default_logo_url" },
      public_id: String,
    },
    coverPic: {
      secure_url: String,
      public_id: String,
    },
    legalAttachment: {
      secure_url: String,
      public_id: String,
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
    },
    approvedByAdmin: {
      type: Boolean,
      default: false,
    },
    bannedAt: Date,
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

collegeSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  next();
});

const collegeModel = mongoose.model("college", collegeSchema);

export default collegeModel;
