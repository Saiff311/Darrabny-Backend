import applicationModel from "../../DB/models/application.model.js";
import internshipModel from "../../DB/models/internship.model.js";
import { placementModel } from "../../DB/models/placment.model.js";
import studentModel from "../../DB/models/student.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";

export const createPlacementIfNotExists = async (application) => {
  const student = await studentModel.findOne({ userId: application.userId });
  if (!student) return null;

  const exists = await placementModel.findOne({
    studentId: student._id,
    internshipId: application.internshipId,
  });
  if (exists) return null;

  const internship = await internshipModel.findById(application.internshipId);
  if (!internship) return null;

  const placement = await placementModel.create({
    studentId: student._id,
    internshipId: application.internshipId,
    supervisorId: internship.supervisorId || null,
    companyId: application.companyId,
    startDate: internship.startDate || new Date(),
    endDate: internship.endDate || null,
    status: "pending",
  });


  return placement;
};


export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const application = await applicationModel.findById(req.params.id);

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!application.timeline || application.timeline.length === 0) {
    application.timeline = [
      {
        status,
        date: new Date(),
      },
    ];
  } else {
   
    const lastIndex = application.timeline.length - 1;

    application.timeline[lastIndex].status = status;
    application.timeline[lastIndex].date = new Date();
  }

  await application.save();

  // trigger placement creation
  let placement = null;
  
  if (status === "accepted") {
    placement = await createPlacementIfNotExists(application);
  }

  res.status(200).json({
    message: "Application updated successfully",
    placementCreated: !!placement,
  });
});