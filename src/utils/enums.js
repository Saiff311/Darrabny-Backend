export const genders = {
  male: "male",
  female: "female",
};
Object.freeze(genders);

export const otpType = {
  confirmEmail: "confirmEmail",
  forgetPassword: "forgetPassword",
};
Object.freeze(otpType);

export const providers = {
  google: "google",
  system: "system",
};
Object.freeze(providers);

export const roles = {
  student: "student",
  academic_supervisor: "academic_supervisor",
  college: "college",
  company_supervisor: "company_supervisor",
  admin: "admin",
  company: "company",
};
Object.freeze(roles);

export const internshipLocations = {
  onsite: "onsite",
  remote: "remote",
  hybrid: "hybrid",
};
Object.freeze(internshipLocations);

export const workingTimes = {
  partTime: "part-time",
  fullTime: "full-time",
};
Object.freeze(workingTimes);

export const seniorityLevels = {
  junior: "junior",
  mid: "mid",
  senior: "senior",
};

export const appStatus = {
  pending: "pending",
  accepted: "accepted",
  viewed: "viewed",
  inconsideration: "inconsideration",
  rejected: "rejected",
  completed: "completed",
};
Object.freeze(appStatus);

export const internshipStatus = {
  onboarding: "onboarding",
  inProgress: "in-progress",
  completed: "completed",
};

Object.freeze(internshipStatus);

export const reportStatus = {
  draft: "draft",
  submitted: "submitted",
  under_review: "under_review",
  needs_changes: "needs_changes",
  approved: "approved",
  ongoing: "ongoing",
};

Object.freeze(reportStatus);