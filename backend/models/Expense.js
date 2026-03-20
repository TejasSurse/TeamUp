import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
