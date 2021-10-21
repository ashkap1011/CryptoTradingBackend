import mongoose from "mongoose"
const mongo_uri =  "mongodb://mongo:27017/cryptoapp"
const connectDB = async () => {
    try{
        const conn = await mongoose.connect(mongo_uri as string,{
            useNewUrlParser:true,
            useUnifiedTopology:true,
            useFindAndModify:false
        })
        console.log(`MongoDB Connection: ${conn.connection.host}`)
    } catch(err){
        console.error(err)
        process.exit(1)
    }


}

export {connectDB}