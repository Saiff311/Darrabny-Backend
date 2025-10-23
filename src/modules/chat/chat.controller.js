import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { userIdSchema } from "./chat.validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import { getChat } from "./service/chat.service.js";


const chatRouter = Router();

chatRouter.get("/:userId",
    validation(userIdSchema),
    auth(Object.values(roles)),
    getChat
)

export default chatRouter;