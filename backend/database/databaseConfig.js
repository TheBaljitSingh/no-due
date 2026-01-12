  import mongoose from "mongoose";

  const connectDB = async() => {
    try {
       await mongoose.connect(process.env.MONGO_URI);

    } catch (err) {
      console.error("Error initializing DB connections", err);
      throw err;
    }
  };

  export default connectDB;
