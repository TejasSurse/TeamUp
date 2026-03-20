import mongoose from 'mongoose';

const paymentAccountSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('PaymentAccount', paymentAccountSchema);
