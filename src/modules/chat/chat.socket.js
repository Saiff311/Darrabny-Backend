import { authSocket } from "../../middleware/auth.js"
import { logOut, register } from "./service/chat.socket.service.js"
import { sendMessage } from "./service/message.service.js"
import { Server } from "socket.io";


export const runIo = (httpServer)=>{
    const io = new Server(httpServer,{
        cors : "*"
    })

    io.on("connection", async(socket)=>{
        await register(socket)
        await sendMessage(socket)
        await logOut(socket)
    })
}