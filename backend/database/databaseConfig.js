import mongoose from 'mongoose';

let connection;

const connectDB = async() =>{
    try{
        connection = await mongoose.createConnection(process.env.MONGO_URI);
        console.log("Database connected successfully");
    }catch(err){
        console.error("Error connecting to database", err);
        throw err;
    }

}

export default connectDB;
export {connection};