import { asyncHandler } from "../../utils/globalErrorHandling.js";
import reportCommentModel from "../../DB/models/reportComment.model.js";
import reportAttachmentModel from "../../DB/models/reportAttachment.model.js";
import reportModel from "../../DB/models/report.model.js";
import cloudinary from "../../utils/cloudinary.js";

export const addReportComments = asyncHandler(async (req, res) => {
  const { id: reportId } = req.params;
  const { message } = req.body;

  // Get sender info - handle both user and company
  const senderId = req.user?._id || req.company?._id;
  const senderRole = req.user?.role || "company";

  if (!senderId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Create the comment
  const comment = await reportCommentModel.create({
    reportId,
    senderId,
    senderRole,
    message,
  });

  // Return the comment with the required fields
  res.status(201).json({
    success: true,
    data: {
      commentId: comment._id,
      message: comment.message,
      createdAt: comment.createdAt,
    },
  });
});

export const uploadReportAttachment = asyncHandler(async (req, res) => {
  const { id: reportId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify report exists
  const report = await reportModel.findById(reportId);
  if (!report) {
    return res.status(404).json({ message: "Report not found" });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  try {
    // Upload file to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "report-attachments",
      resource_type: "auto",
      public_id: `${reportId}_${Date.now()}`,
    });

    // Create attachment record in DB
    const attachment = await reportAttachmentModel.create({
      reportId,
      fileName: req.file.originalname,
      fileUrl: cloudinaryResult.secure_url,
      fileSize: req.file.size,
      uploadedBy: userId,
    });

    res.status(201).json({
      success: true,
      data: {
        attachmentId: attachment._id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});

export const deleteReportAttachment = asyncHandler(async (req, res) => {
  const { id: reportId, attachmentId } = req.params;
  const userId = req.user?._id;
  const userRole = req.user?.role;
  const companyId = req.company?._id;

  if (!userId && !companyId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Find the attachment
  const attachment = await reportAttachmentModel.findById(attachmentId);
  if (!attachment) {
    return res.status(404).json({ message: "Attachment not found" });
  }

  // Verify attachment belongs to the report
  if (attachment.reportId.toString() !== reportId) {
    return res.status(400).json({ message: "Attachment does not belong to this report" });
  }

  // Check authorization - only uploader or company role can delete
  const isUploader = attachment.uploadedBy.toString() === userId?.toString();
  const isCompanyRole = userRole === "company" || companyId;

  if (!isUploader && !isCompanyRole) {
    return res.status(403).json({ message: "Not authorized to delete this attachment" });
  }

  try {
    // Extract public_id from fileUrl to delete from Cloudinary
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
    const urlParts = attachment.fileUrl.split("/");
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicId = `report-attachments/${publicIdWithExtension.split(".")[0]}`;

    const extension = attachment.fileUrl.split(".").pop().toLowerCase();

    let resourceType = "image";

    if (["mp4", "mov", "avi"].includes(extension)) {
      resourceType = "video";
    } else if (["pdf", "doc", "docx", "zip"].includes(extension)) {
      resourceType = "raw";
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

    // Delete from DB
    await reportAttachmentModel.findByIdAndDelete(attachmentId);

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting attachment", error: error.message });
  }
});