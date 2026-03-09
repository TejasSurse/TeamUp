import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['SuperAdmin', 'TurfOwner', 'Customer'],
        default: 'Customer'
    },
    isBlocked: { type: Boolean, default: false },
    managedTurfs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Turf' }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);
