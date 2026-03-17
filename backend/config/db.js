import mongoose from 'mongoose';

let cachedConn = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (cachedConn) {
        return cachedConn;
    }

    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            // Options for robustness
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        cachedConn = conn;
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Don't exit process in serverless!
        throw error;
    }
};

export default connectDB;
