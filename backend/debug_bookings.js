import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const bookings = await Booking.find({}).populate('paymentAccount');
        console.log(`Total Bookings: ${bookings.length}`);
        
        bookings.forEach(b => {
            console.log(`ID: ${b._id}, Status: ${b.bookingStatus}, User: ${b.user}, Booker: ${b.bookerName}, Account: ${b.paymentAccount ? b.paymentAccount.name : 'NULL'}, RawAccount: ${b.paymentAccount}`);
        });
        process.exit();
    } catch (e) { console.error(e); process.exit(1); }
};
debug();
