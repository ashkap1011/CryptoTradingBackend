import mongoose, {Schema} from "mongoose"

const WalletSchema:Schema = new Schema({

    user: {
        type: String,
        
    },
    Currency: {
        type:String,
        trim: true,
    },
})

export default mongoose.model('Wallet', WalletSchema)
