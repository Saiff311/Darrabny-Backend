import chatModel from "../../../DB/models/chat.model.js";
import { asyncHandler } from "../../../utils/globalErrorHandling.js";


export const getChat = asyncHandler(async(req,res, next) => {
    const {userId} = req.params
    const chat = await chatModel.findOne({
        $or: [
            {senderId: userId, receiverId: req.user._id},
            {receiverId: userId, senderId: req.user._id}
        ]
    }).populate([
        {path: "senderId"},
        {path: "messages.senderId"}
    ])
    return res.status(200).json({message: "Chat found", chat})
})