import {Router} from 'express';
import { validation } from '../../middleware/validation.js';
import { auth } from '../../middleware/auth.js';
import { roles } from '../../utils/enums.js';
import * as JV from './internship.validation.js';
import * as JS from "./internship.service.js"
import { fileTypes, hostMulter } from '../../middleware/multer.js';

const internshipRouter = Router();

internshipRouter.post("/add",
    validation(JV.addInternshipSchema),
    auth(Object.values(roles)),
    JS.addInternship
)


internshipRouter.get("/my",
    auth([roles.student]),
    (req, res) => {
        console.log("MY ROUTE WORKED");
        res.json({ message: "OK" });
    }
)

internshipRouter.patch("/:internshipId",
    validation(JV.updateInternshipSchema),
    auth(Object.values(roles)),
    JS.updateInternship
)

internshipRouter.delete("/:internshipId",
    validation(JV.InternshipIdSchema),
    auth(Object.values(roles)),
    JS.deleteInternship
)

internshipRouter.get("/companyInternships/:companyId?",
    validation(JV.getCompanyInternshipsSchema),
    auth(Object.values(roles)),
    JS.getCompanyInternships
)


internshipRouter.get("/:internshipId",
    validation(JV.InternshipIdSchema),
    auth(Object.values(roles)),
    JS.getInternshipById
)

internshipRouter.get("/filteredInternships",
    validation(JV.getFilteredInternshipsSchema),
    auth(Object.values(roles)),
    JS.getFilteredInternships
)

internshipRouter.get("/internshipApp",
    validation(JV.InternshipIdSchema),
    auth(Object.values(roles)),
    JS.getInternshipApp
)

internshipRouter.post("/ApplyToInternship/:internshipId",
    validation(JV.InternshipIdSchema),
    auth([roles.user]),
    hostMulter(fileTypes.image).single("userCV"),
    JS.ApplyToInternship
)

internshipRouter.patch("/responseApp/:appId",
    validation(JV.responseAppSchema),
    auth(Object.values(roles)),
    JS.responseApp
)

export default internshipRouter;