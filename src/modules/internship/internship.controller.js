import {Router} from 'express';
import { validation } from '../../middleware/validation.js';
import { auth } from '../../middleware/auth.js';
import { roles } from '../../utils/enums.js';
import * as IV from './internship.validation.js';
import * as IS from "./internship.service.js"
import { fileTypes, hostMulter } from '../../middleware/multer.js';

const internshipRouter = Router();


internshipRouter.post("/companyId/:companyId",
    validation(IV.addInternshipSchema),
    auth(Object.values(roles)),
    IS.addInternship
)

internshipRouter.patch("/:internshipId",
    validation(IV.updateInternshipSchema),
    auth([roles.company, roles.admin]),
    IS.updateInternship
)

internshipRouter.delete("/:internshipId/companyId/:companyId",
    validation(IV.InternshipIdSchema),
    auth([roles.company, roles.admin]),
    IS.deleteInternship
)

internshipRouter.get("/companyInternships/:companyId?",
    validation(IV.getCompanyInternshipsSchema),
    auth(roles.company),
    IS.getCompanyInternships
)

internshipRouter.get("/:internshipId",
    validation(IV.InternshipIdSchema),
    auth(Object.values(roles)), 
    IS.getInternship
)

internshipRouter.get("/filteredInternships",
    validation(IV.getFilteredInternshipsSchema),
    auth(Object.values(roles)),
    IS.getFilteredInternships
)

internshipRouter.get("/internshipApp",
    validation(IV.InternshipIdSchema),
    auth(Object.values(roles)),
    IS.getInternshipApp
)

internshipRouter.post("/ApplyToInternship/:internshipId",
    validation(IV.InternshipIdSchema),
    auth([roles.user]),
    hostMulter(fileTypes.image).single("userCV"),
    IS.ApplyToInternship
)

internshipRouter.patch("/responseApp/:appId",
    validation(IV.responseAppSchema),
    auth(Object.values(roles)),
    IS.responseApp
)

export default internshipRouter;