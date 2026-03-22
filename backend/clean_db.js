import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';
import Expense from './models/Expense.js';
import PaymentAccount from './models/PaymentAccount.js';
import Turf from './models/Turf.js';
import User from './models/User.js';

dotenv.config();

const cleanDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/turfbooking');

        console.log('Connected to MongoDB.');
        console.log('Clearing all system data (bookings, expenses, turfs, accounts, users) except the Super Admin...');

        await Booking.deleteMany({});
        console.log(' - Deleted all Bookings');
        
        await Expense.deleteMany({});
        console.log(' - Deleted all Expenses');
        
        await PaymentAccount.deleteMany({});
        console.log(' - Deleted all Payment Accounts');

        await Turf.deleteMany({});
        console.log(' - Deleted all Turfs');

        await User.deleteMany({ role: { $ne: 'SuperAdmin' } });
        console.log(' - Deleted all non-admin Users');

        console.log('\nSystem successfully cleaned! You are left with a blank slate + Super Admin.');
        process.exit();
    } catch (error) {
        console.error('Error cleaning database:', error);
        process.exit(1);
    }
};

cleanDatabase();
