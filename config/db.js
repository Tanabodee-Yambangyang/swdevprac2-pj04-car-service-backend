const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  const conn = await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  });

  console.log(`MongoDB Connected: ${conn.connection.host}`);

  return conn;
};

module.exports = connectDB;