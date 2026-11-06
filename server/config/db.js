const mongoose = require("mongoose");

const connectDB = async (uri) => {
  const connection = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

const disconnectDB = () => mongoose.disconnect();
module.exports = { connectDB, disconnectDB };
