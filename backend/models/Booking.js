import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    totalPrice: { type: Number, required: true },
    numberOfPlayers: { type: Number, required: true, default: 1 },
    splitCostPerPlayer: { type: Number, required: true },
    bookingStatus: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Rejected', 'Cancelled'],
        default: 'Pending'
    }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
