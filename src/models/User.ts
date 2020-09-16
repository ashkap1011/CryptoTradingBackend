import mongoose, { Schema } from "mongoose"

const UserSchema:Schema = new Schema({
    username: {
        type:String,
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

interface UserDoc extends mongoose.Document {
    username: String,
    password: String
}


export default mongoose.model<UserDoc>('User', UserSchema)