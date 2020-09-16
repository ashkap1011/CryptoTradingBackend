import mongoose, {Schema} from "mongoose"

const WalletItemSchema:Schema = new Schema({
    symbol:{
        type: String,
        unique:true,
        required: true
    },
    quantity:{
        type: Number,
        required: true
    },
})

const WalletSchema:Schema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
    },
    wallet: {
        type:[WalletItemSchema],    //Array of JSON objects where each one represents a crypto key
        trim: true,
    },
    //trading history i.e. all executed orders completely
    /***
     * isbuy/issell, symbol, quantity, isprofit, percentage to 2 dp, btc gained/loss
     * 
     */

     //active orders
     /***
      * isbuy/issell, symbol, quantity, initial price, 
      *  
      */

})


const ParentSchema = new Schema({
    fromParent: Boolean
  });
  
  const ChildSchema = new Schema({
    ...ParentSchema.obj,
    fromChild: Boolean // new properties come up here
  });

export interface WalletItem {
    symbol: String,
    quantity: number
}

interface WalletDoc extends mongoose.Document {
    userId: Schema.Types.ObjectId,
    wallet: [WalletItem]
}


export default mongoose.model<WalletDoc>('Wallet', WalletSchema)
