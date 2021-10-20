import mongoose, {Schema} from "mongoose"

const WalletItemSchema:Schema = new Schema({
    symbol:{
        type: String,
    },
    quantity:{             //available quantity for placing orders
        type: Number,
    },

    lockedQuantity:{        //quantity locked on placement of orders 
        type: Number,
        default: 0,
    }
})

const CryptoEquitySchema: Schema = new Schema({
    symbol:{
        type: String,
    },
    quantity:{
        type: Number,
    }
})

const ExecutedOrderSchema: Schema = new Schema({
    cryptoEquity: {
        type: CryptoEquitySchema,
    },

    isBuy: {
        type: Boolean
    },

})

const UserAccountSchema:Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
    },
    wallet: {
        type:[WalletItemSchema],    //Array of JSON objects where each one represents a cryptocurrency and locked crypto
    },
    executedOrders: {               
        type:[ExecutedOrderSchema]
    }

})

export interface WalletItem {
    symbol: String,
    quantity: number,
    lockedQuantity: number,
}

export interface CryptoEquity {
    symbol:String,
    quantity:number,
}

export interface ExecutedOrder {
    cryptoEquity: CryptoEquity,
    isBuy: boolean,
}


interface UserAccountDoc extends mongoose.Document {
    userId: Schema.Types.ObjectId
    wallet: [WalletItem]
    executedOrders: [ExecutedOrder]
}


export default mongoose.model<UserAccountDoc>('UserAccount', UserAccountSchema)
