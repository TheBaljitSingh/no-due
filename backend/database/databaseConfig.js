import mongoose from "mongoose";

let connection;

const connectDB = async() => {
  try {
    connection = await mongoose.createConnection(process.env.MONGO_URI);


  } catch (err) {
    console.error("Error initializing DB connections", err);
    throw err;
  }
};

export default connectDB;
export { connection };
