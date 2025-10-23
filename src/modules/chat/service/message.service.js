import chatModel from "../../../DB/models/chat.model.js";
import { connectionUser } from "../../../DB/models/user.model.js";
import { authSocket } from "../../../middleware/auth.js";


export const sendMessage = async (socket)=>{
    socket.on('sendMessage', async (messageInfo)=>{
        console.log( messageInfo);
        const {message, destId} = messageInfo
        const data = await authSocket({socket})
        if (data.statusCode != 200){
            return socket.emit("authError",data)
        }
        const userId = data.user._id
        let chat
        chat = await chatModel.findOneAndUpdate({
            $or: [
                {senderId: userId, receiverId: destId},
                {receiverId: userId, senderId: destId}
        ]
        },{
            $push: {messages: {senderId: userId,message}}
        },{new: true})
    })
    if(!chat){
        chat = await chatModel.create({
            senderId: userId,
            receiverId: destId,
            messages: [{senderId: userId,message}]
        })
    }
    socket.emit("successMessage",{message})
    socket.to(connectionUser.get(destId.toString())).emit("recieveMessage",{message, chat})
}