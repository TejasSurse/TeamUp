import mongoose from 'mongoose';

const turfSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    sportTypes: [{ type: String }], // e.g., ['Football', 'Cricket']
    pricePerHour: { type: Number, required: true },
    images: [{ type: String }], // Clouindary URLs, max 4
    status: {
        type: String,
        enum: ['Active', 'Blocked', 'Pending'],
        default: 'Active'
    },
    openingHours: {
        open: { type: String, default: "06:00" }, // e.g. "06:00"
        close: { type: String, default: "23:00" } // e.g. "23:00"
    }
}, { timestamps: true });

// Ensure array limit to 4
turfSchema.path('images').validate(function (value) {
    if (value.length > 4) {
        throw new Error('Turf can have at most 4 images');
    }
});

export default mongoose.model('Turf', turfSchema);
