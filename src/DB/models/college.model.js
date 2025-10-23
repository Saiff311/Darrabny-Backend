import mongoose from "mongoose"

const collegeSchema = new mongoose.Schema({
   collegeName: { 
        type: String,
        required: true,
        unique: true,
        minLength: 2,
        trim: true
    },
    departments: [
        {
        name: { type: String, trim: true, required: true },
        head: { type: String, trim: true, required: true },
        },
    ],
    address: {
        type: String,
        require: true,
        trim: true
    },
   collegeEmail : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/
    },
    collegeAdmin: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    logo: {
        secure_url: String,
        public_id: String
    },
    coverPic: {
        secure_url: String,
        public_id: String
    },
    bannedAt: Date,
    deletedAt: Date,

    legalAttachment: {
        secure_url: String,
        public_id: String
    },
    approvedByAdmin: {
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

const collegeModel = mongoose.model("college",collegeSchema)

export default collegeModel