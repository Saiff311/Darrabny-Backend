import { placementModel } from "../../DB/models/placment.model.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";
import { calculateProgress } from "../../utils/local-functions/calculateProgress.js";



 export const getPlacementProgress = asyncHandler(async (req, res) => {
  const placement = await placementModel.findById(req.params.id);

  if (!placement) {
    return res.status(404).json({ message: "Placement not found" });
  }

  const progressData = calculateProgress(
    placement.startDate,
    placement.endDate
  );

  res.json({
    ...placement.toObject(),
    progress: progressData
  });
});

export const getPlacementDetails = asyncHandler(async (req, res) => {
  const placement = await placementModel.findById(req.params.id)

  if (!placement) {
    return res.status(404).json({ message: "Placement not found" });
  }
  const progressData = calculateProgress(
    placement.startDate || placement.internshipId.startDate,
    placement.endDate || placement.internshipId.endDate
  );

  res.json({
    id: placement._id,
    internshipId: placement.internshipId._id,

    student: {
      id: placement.studentId._id,
      fullName: placement.studentId.fullName
    },

    supervisor: {
      id: placement.supervisorId._id,
      fullName: placement.supervisorId.fullName
    },

    startDate: placement.startDate,
    endDate: placement.endDate,
    status: placement.status,

    currentWeek: progressData.currentWeek,
    totalWeeks: progressData.totalWeeks,
    progress: progressData.progress
  });
});