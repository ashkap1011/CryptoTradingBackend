import mongoose, {Schema,Document} from "mongoose"

// Schema
const CurrencySchema: Schema = new Schema({
    symbol:{
        type: String,
    },
    quantity:{
        type: Number,
    }
})

const ActiveOrderSchema = new Schema({
    orderType: {
        type: Number,
        enum: [0, 1],
        default: 0,
        required: true
    },

    isBuy:{
        type: Boolean,
        required: true
    },

    currency: {
        type: CurrencySchema
    },

    executionPrice: {   //ratio compared to btc if  >1 
        type: Number,
    },


})

export enum orderType {
    Limit = 0,
    Market = 1
}

// ActiveOrderSchema.methods.getOrderType = function() {
//     return this.orderType > 0  ? "Market" : "Limit"
// }
  

const UserActiveOrdersSchema: Schema= new Schema({
    userId: {
        type: Schema.Types.ObjectId
    }, 
    activeOrders: {
        type: [ActiveOrderSchema]
    }
})

export interface Currency {
    symbol:String,
    quantity: number,
}

export interface ActiveOrder {
    orderType: orderType,
    isBuy: Boolean,
    currency: Currency,
    executionPrice: number,
}

interface UserActiveOrdersDoc extends mongoose.Document {
    userId: Schema.Types.ObjectId
    activeOrders: [ActiveOrder]
}
 
export default mongoose.model<UserActiveOrdersDoc>('UserActiveOrders', UserActiveOrdersSchema)
