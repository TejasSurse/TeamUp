import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Booking from './models/Booking.js';

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for migration');

        const bookings = await Booking.find({ paymentAccount: { $exists: true, $ne: null } });
        console.log(`Found ${bookings.length} bookings to check/migrate`);

        let count = 0;
        for (const b of bookings) {
            if (typeof b.paymentAccount === 'string' && b.paymentAccount.length === 24) {
                b.paymentAccount = new mongoose.Types.ObjectId(b.paymentAccount);
                await b.save();
                count++;
            }
        }

        console.log(`Successfully migrated ${count} bookings.`);
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
