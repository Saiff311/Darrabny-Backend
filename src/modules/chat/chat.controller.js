import { Router } from "express";
import { validation } from "../../middleware/validation.js";
import { userIdSchema } from "./chat.validation.js";
import { auth } from "../../middleware/auth.js";
import { roles } from "../../utils/enums.js";
import { getChat } from "./service/chat.service.js";
import { handleChatbotMessage } from "../../services/ai/ai.service.js";
import { asyncHandler } from "../../utils/globalErrorHandling.js";


const chatRouter = Router();

export const chatWithBot = asyncHandler(async (req, res, next) => {
    try {
        const { message, history } = req.body;

        if (!message || typeof message !== "string") {
            return next(new Error("Message is required", { cause: 400 }));
        }

        const reply = await handleChatbotMessage(
            message,
            Array.isArray(history) ? history : [],
        );

        return res.status(200).json({ success: true, reply });
    } catch (error) {
        return next(error);
    }
});

chatRouter.get("/:userId",
    validation(userIdSchema),
    auth(Object.values(roles)),
    getChat
)

chatRouter.post(
    "/bot",
    // auth(Object.values(roles)),
    chatWithBot,
);

export default chatRouter;