import Turf from '../models/Turf.js';
import Booking from '../models/Booking.js';

// @desc    Fetch all active turfs (supports filtering by city/location)
// @route   GET /api/turfs
// @access  Public
export const getTurfs = async (req, res) => {
    try {
        const { city, limit } = req.query;
        let query = { status: 'Active' };

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        let turfsQuery = Turf.find(query);
        if (limit) {
            turfsQuery = turfsQuery.limit(parseInt(limit));
        }

        const turfs = await turfsQuery;
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single turf
// @route   GET /api/turfs/:id
// @access  Public
export const getTurfById = async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id).populate('owner', 'name phone');
        if (turf) {
            res.json(turf);
        } else {
            res.status(404).json({ message: 'Turf not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a turf
// @route   POST /api/turfs
// @access  Private/TurfOwner
export const createTurf = async (req, res) => {
    try {
        const turfData = { ...req.body, owner: req.user._id };
        const turf = new Turf(turfData);
        const createdTurf = await turf.save();
        res.status(201).json(createdTurf);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a turf
// @route   PUT /api/turfs/:id
// @access  Private/TurfOwner
export const updateTurf = async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);

        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        if (turf.owner.toString() !== req.user._id.toString() && req.user.role !== 'SuperAdmin') {
            return res.status(401).json({ message: 'Not authorized to update this turf' });
        }

        Object.assign(turf, req.body);
        const updatedTurf = await turf.save();
        res.json(updatedTurf);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a turf
// @route   DELETE /api/turfs/:id
// @access  Private/TurfOwner or SuperAdmin
export const deleteTurf = async (req, res) => {
    try {
        const turf = await Turf.findById(req.params.id);

        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        if (turf.owner.toString() !== req.user._id.toString() && req.user.role !== 'SuperAdmin') {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await Turf.deleteOne({ _id: req.params.id });
        res.json({ message: 'Turf removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Owner's Turfs
// @route   GET /api/turfs/owner/me
// @access  Private/TurfOwner
export const getMyTurfs = async (req, res) => {
    try {
        const turfs = await Turf.find({ owner: req.user._id });
        res.json(turfs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new review
// @route   POST /api/turfs/:id/reviews
// @access  Private (Customer)
export const createTurfReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const turfId = req.params.id;

        const turf = await Turf.findById(turfId);
        if (!turf) {
            return res.status(404).json({ message: 'Turf not found' });
        }

        // Check if the user has booked this turf before (bookingStatus: 'Confirmed' or 'Completed', or just booked)
        // Adjust the condition based on how booking status is used
        const hasBooked = await Booking.findOne({
            turf: turfId,
            user: req.user._id,
            bookingStatus: { $in: ['Confirmed', 'Pending'] } // Or maybe any non-cancelled booking is enough to let them review
        });

        if (!hasBooked) {
            return res.status(400).json({ message: 'You can only review a turf after booking it' });
        }

        // Check if user already reviewed
        const alreadyReviewed = turf.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ message: 'Turf already reviewed by you' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        turf.reviews.push(review);
        turf.numReviews = turf.reviews.length;
        turf.rating =
            turf.reviews.reduce((acc, item) => item.rating + acc, 0) /
            turf.reviews.length;

        await turf.save();
        res.status(201).json({ message: 'Review added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
