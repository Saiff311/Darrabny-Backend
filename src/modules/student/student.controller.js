import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import * as US from "./student.service.js";
import * as UV from "./student.validation.js";
import { auth } from "../../middleware/auth.js";
import { hostMulter, fileTypes } from "../../middleware/multer.js";
import { roles } from "../../utils/enums.js";

const StudentRouter = Router();

StudentRouter.patch(
  "/UpdateStudentAccount",
  validation(UV.UpdateStudentAccountSchema),
  auth([roles.student]),
  US.UpdateStudentAccount,
);

StudentRouter.get(
  "/getLoginStudent",
  auth([roles.student]),
  US.getLoginStudent,
);

StudentRouter.post(
  "/skills",
  validation(UV.addSkillSchema),
  auth([roles.student]),
  US.addSkill,
);

StudentRouter.get("/skills", auth([roles.student]), US.getSkills);

StudentRouter.delete(
  "/skills",
  validation(UV.deleteSkillSchema),
  auth([roles.student]),
  US.deleteSkill,
);

StudentRouter.post(
  "/projects",
  validation(UV.addProjectSchema),
  auth([roles.student]),
  US.addProject,
);

StudentRouter.get("/projects", auth([roles.student]), US.getProjects);

StudentRouter.patch(
  "/projects/:projectId",
  validation(UV.updateProjectSchema),
  auth([roles.student]),
  US.updateProject,
);

StudentRouter.delete(
  "/projects/:projectId",
  validation(UV.deleteProjectSchema),
  auth([roles.student]),
  US.deleteProject,
);

StudentRouter.put(
  "/resume",
  // validation(UV.UploadResumeSchema),
  hostMulter(fileTypes.pdf).single("attachment"),
  auth([roles.student]),
  US.uploadResume,
);

StudentRouter.get("/resume",
  auth([roles.student]),
  US.downloadResume);

StudentRouter.put(
  "/avatar",
  hostMulter(fileTypes.image).single("attachment"),
  auth(Object.values(roles)),
  US.UploadProfilePic,
);

StudentRouter.put(
  "/avatar2",
  hostMulter(fileTypes.image).single("attachment"),
  auth(Object.values(roles)),
  US.uploadPice,
);

StudentRouter.get(
  "/getAnotherUser/:id",
  validation(UV.getAnotherUserSchema),
  auth(Object.values(roles)),
  US.getAnotherUser,
);

StudentRouter.patch(
  "/updatePassword",
  validation(UV.updatePasswordSchema),
  auth(Object.values(roles)),
  US.updatePassword,
);

StudentRouter.patch(
  "/UploadCoverPic",
  hostMulter(fileTypes.image).single("attachment"),
  auth(Object.values(roles)),
  US.UploadCoverPic,
);

StudentRouter.delete(
  "/deleteProfilePic",
  auth(Object.values(roles)),
  US.deleteProfilePic,
);

StudentRouter.delete(
  "/deleteCoverPic",
  auth(Object.values(roles)),
  US.deleteCoverPic,
);

StudentRouter.delete("/softDelete", auth(Object.values(roles)), US.softDelete);

export default StudentRouter;
