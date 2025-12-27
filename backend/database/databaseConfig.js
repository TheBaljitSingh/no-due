import mongoose from 'mongoose';

let connection;
let connection2;

const connectDB = async() =>{
    try{
        connection = await mongoose.createConnection(process.env.MONGO_URI);
        connection2 = await mongoose.createConnection(process.env.MONGO_URI2);
        console.log("Database connected successfully");
    }catch(err){
        console.error("Error connecting to database", err);
        throw err;
    }

}

export default connectDB;
export {connection, connection2};