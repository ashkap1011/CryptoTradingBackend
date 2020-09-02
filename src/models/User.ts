import mongoose, { Schema } from "mongoose"

const UserSchema:Schema = new Schema({
    name: {
        type:String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password:{
        type:String,
        required: true,
        trim: true,
    },
})

export default mongoose.model('User', UserSchema)