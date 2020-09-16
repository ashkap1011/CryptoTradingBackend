
import { Document, Model, model, Types, Schema, Query } from "mongoose"

// Schema
const OrderSchema = new Schema({
    orderType: {
        type: Number,
        enum: [0, 1],
        default: 0,
        required: true
    },

    isBuy:{
        type: Number,
        enum: [0, 1],
        default: 0,
        required: true
    },

    symbol:{
        type: String,
        unique:true,
        required: true

    },

    quantity:{
        type: Number,
        required: true
    },

    beginningValue: {   //ratio compared to btc if  >1 
        type: Number,
        required: true,
    },
    
    executionValue: {   //ratio compared to btc
        type: Number,
        
    }

})


enum orderType {
  Market = 1,
  Limit = 0
}

enum isBuy {
    Buy = 1,
    Sell = 0
}

OrderSchema.methods.getOrderType = function() {
    return this.orderType > 0  ? "Market" : "Limit"
}
  
OrderSchema.methods.isBuy = function() {
    return this.orderType > 0  ? "Buy" : "Sell"
}


interface OrderDoc extends Document {
    orderType: orderType,
    isBuy: isBuy,
    symbol: String,
    quantity: number,
}


