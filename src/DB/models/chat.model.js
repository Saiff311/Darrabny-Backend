import mongoose from "mongoose"

const chatSchema = mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    receiverId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    messages: [{
        message: {
            type: String,
            required: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now // Automatically set the timestamp when a message is created
        }
    }]
})


const chatModel = mongoose.model("chat", chatSchema)

export default chatModel