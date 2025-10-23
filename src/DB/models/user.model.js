import mongoose from "mongoose"
import { hash } from "../../utils/security/hashing.js"
import {encrypt} from  "../../utils/security/encryption.js"
import {providers, roles, genders, otpType} from "../../utils/enums.js"
import applicationModel from "./application.model.js"
import chatModel from "./chat.model.js"
import jobModel from "./internship.model.js"
import cron from "node-cron"

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true, // error possibility
        trim: true,
        minLength: [3,"Name too short"],
        maxLength: [30,"Name too long"]
    },
    lastName : {
        type: String,
        required: true,
        trim: true,
        minLength: [3,"Name too short"],
        maxLength: [30,"Name too long"]
    },
    email: {
        type: String,
        required:true,
        unique: true,
        trim: true,
        match: /^[\w\-\.]+@([\w-]+\.)+[\w-]{2,}$/
    },
    password: {
        type: String,
        trim: true,
        minLength: [6,"Password must be more than or equal 6 characters"],
        match: /^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/
    },
    provider: {
        type: String,
        enum: Object.values(providers),
        default: providers.system
    },
    gender: {
        type: String,
        enum: Object.values(genders),
        default: genders.male
    },
    DOB: {
        type: Date,
        validator: function(value) {
            // Calculate the date 18 years ago from today
            const eighteenYearsAgo = new Date();
            eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    
            // Check if the DOB is before the date 18 years ago
            return value <= eighteenYearsAgo;
          },
          message: 'User must be at least 18 years old.'    
    },
    
    mobileNumber: String ,
    
    role: {
        type: String,
        enum: Object.values(roles),
        default: roles.user
    },
    isConfirmed: {
        type: Boolean,
        default: false
    },
    
    deletedAt: Date ,
    
    bannedAt: Date,
    
    isDeleted: {
        type: Boolean,
        default: false
    }, 
    updatedBy :{
        type:  mongoose.Schema.Types.ObjectId,
        ref: "user"
    },

    changeCredentialTime: Date ,
    
    profilePic: {
        secure_url: String,
        public_id: String,
      },
    coverPic: {
    secure_url: String,
    public_id: String,
    },

    skills: [String],
    
    resume: {
        secure_url: String,
        public_id: String,
    },
    linkedinProfile: {
        type: String,
        match: /^(https?:\/\/)?(www\.)?linkedin\.com\/.*$/i,
        trim: true
    },
    portfolio: {
        type: String,
        match: /^(https?:\/\/)?(www\.)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i,
        trim: true
    },
    bio: {
        type: String,
        maxLength: [500, "Bio cannot be more than 500 characters"],
        trim: true
    },
    description : {
        type: String,
        maxLength: [2000, "Description cannot be more than 2000 characters"],
        trim: true
    },
    savedInternships: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "internship"
    }],
    otp: [{
        code: {
          type: String,
          require: true
        },
        type: {
          type: String,
          enum: Object.values(otpType),
          require: true
        },
        expiresIn: {
          type: Date,
          required: true
        }
      }]
},{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})
 //socket id and user id
export const connectionUser = new Map()
// User name
userSchema.virtual("userName").get(function(){
    return `${this.firstName} ${this.lastName}`
})
//Hashing & encryption hook
userSchema.pre("save",async function(next){
    // hashing password     
    if (this.isModified("password")){
        this.password = await hash(this.password)
    }
    // hashing otp    
    if (this.otp && this.otp.length > 0) {
        for(let i=0; i<this.otp.length; i++){
            this.otp[i].code = await hash(this.otp[i].code)
        }
        this.markModified("otp"); // Ensure Mongoose knows otp is modified 
    }
    // encrypt mobileNumber
    if (this.isModified("mobileNumber")) {
        this.mobileNumber = encrypt(this.mobileNumber);        
    }
    next() // to prevent hanging the save operation.
})
// Delete any related documents
userSchema.pre("remove",async function(next){
    try{
        await applicationModel.deleteMany({userId: this._id})
        await chatModel.deleteMany({senderId: this._id})
        await jobModel.deleteMany({$or: [
            {addedBy:this._id},
            {updatedBy: this._id}
        ]})// I didn't delete the company if the user (who created it) is deleted because it doesn't make sense 
        next() // Proceed with the user deletion
    }catch(err){
        next(err) //passing the error to mongoose
    }
})

// CRON Job for Deleting Expired OTP Codes "Runs every 6 hours"
cron.schedule("0 */6 * * *", async () => {
    const now = new Date();
    await userModel.updateMany(
        {}, // Apply to all users
        { $pull: { otp: { expiresIn: { $lte: now } } } } // Remove expired OTPs
    );
})

const userModel = mongoose.model("user",userSchema)

export default userModel



