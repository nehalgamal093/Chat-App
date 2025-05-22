import mongoose from "mongoose";

const connectToMongoDB = async () => {
  try {
    // Connection options to prevent timeout issues
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give up initial connection after 30 seconds
    };

    await mongoose.connect(process.env.MONGO_DB_URI, options);

    console.log("Connected to MongoDB");

    // Listen to connection events
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });

    return mongoose.connection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit process with failure
  }
};

export default connectToMongoDB;
