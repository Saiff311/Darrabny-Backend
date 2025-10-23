import mongoose from "mongoose"
import { appStatus } from "../../utils/enums.js"

const applicationSchema = mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'jobOpportunity'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },
    userCV: {
        secure_url: String,
        public_id: String
    },
    status: {
        type: String,
        enum: Object.values(appStatus),
        default: appStatus.pending
    }
}) 

const applicationModel = mongoose.model("application", applicationSchema)

export default applicationModel