import mongoose from "mongoose"


const company_supervisorSchema = new mongoose.Schema({
    userId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    companyId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "company",
        required: true
    },
    position : {
        type: String,
        required: true
    }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

const company_supervisorModel = mongoose.model("company_supervisor",company_supervisorSchema)

export default company_supervisorModel



