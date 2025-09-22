import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // Remove deprecated options
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`, { error: error.stack });
    process.exit(1); // Exit process with failure
  }
};

export default connectDB;
