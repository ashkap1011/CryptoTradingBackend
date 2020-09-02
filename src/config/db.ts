import mongoose from "mongoose"

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI as string,{
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