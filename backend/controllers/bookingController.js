import Booking from '../models/Booking.js';
import Turf from '../models/Turf.js';
import User from '../models/User.js';
import PaymentAccount from '../models/PaymentAccount.js';

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = async (req, res) => {
    try {
        const { turfId, date, startTime, endTime, totalPrice, numberOfPlayers, bookerName, paymentAccount, advanceAmount } = req.body;

        const turf = await Turf.findById(turfId);
        if (!turf) return res.status(404).json({ message: 'Turf not found' });

        // Check if user is blocked
        if (req.user.isBlocked) {
            return res.status(403).json({ message: 'Your account has been blocked. Contact support.' });
        }

        const sStart = parseFloat(startTime);
        const sEnd = parseFloat(endTime);

        if (sEnd <= sStart || sEnd - sStart < 1) {
            return res.status(400).json({ message: 'Invalid time range. Minimum 1 hour booking.' });
        }

        if (sStart % 1 !== 0 || sEnd % 1 !== 0) {
            return res.status(400).json({ message: 'Only complete hours are allowed (e.g., 4:00, 5:00).' });
        }

        // Check each slot against confirmed bookings only
        const existingBookings = await Booking.find({
            turf: turfId, date,
            bookingStatus: 'Confirmed'
        });

        for (let h = sStart; h < sEnd; h += 1) {
            const conflict = existingBookings.some(b => {
                const bS = parseFloat(b.startTime);
                const bE = parseFloat(b.endTime);
                return h >= bS && h < bE;
            });
            if (conflict) {
                const slotEnd = h + 1;
                const formatTime = (time) => `${time}:00`;
                return res.status(400).json({ message: `Slot ${formatTime(h)} - ${formatTime(slotEnd)} is already booked.` });
            }
        }

        const splitCostPerPlayer = totalPrice / numberOfPlayers;

        // Owner walk-in bookings auto-confirm; customer bookings go to Pending
        const isOwnerBooking = req.user.role === 'TurfOwner' && turf.owner.toString() === req.user._id.toString();

        const booking = new Booking({
            turf: turfId,
            user: req.user._id,
            date,
            startTime: String(sStart),
            endTime: String(sEnd),
            totalPrice,
            numberOfPlayers,
            splitCostPerPlayer,
            bookerName: bookerName || null,
            paymentAccount: paymentAccount || null,
            advanceAmount: advanceAmount || 0,
            bookingStatus: isOwnerBooking ? 'Confirmed' : 'Pending'
        });

        const createdBooking = await booking.save();
        res.status(201).json(createdBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get booked slots (only Confirmed ones block the calendar)
// @route   GET /api/bookings/slots/:turfId?date=YYYY-MM-DD
// @access  Public
export const getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;
        const bookings = await Booking.find({
            turf: req.params.turfId, date,
            bookingStatus: 'Confirmed'
        }).select('startTime endTime');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get logged in user bookings
// @route   GET /api/bookings/mybookings
// @access  Private
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('turf', 'name location images pricePerHour')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get bookings for turfs owned by the user
// @route   GET /api/bookings/owner
// @access  Private/TurfOwner
export const getOwnerBookings = async (req, res) => {
    try {
        const turfs = await Turf.find({ owner: req.user._id });
        const turfIds = turfs.map(t => t._id);
        const bookings = await Booking.find({ turf: { $in: turfIds } })
            .populate('turf', 'name')
            .populate('user', 'name phone isBlocked')
            .populate('paymentAccount', 'name')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all bookings (Admin)
// @route   GET /api/bookings
// @access  Private/SuperAdmin
export const getBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('turf', 'name')
            .populate('user', 'name phone')
            .populate('paymentAccount', 'name')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update booking status (Accept/Reject/Cancel)
// @route   PUT /api/bookings/:id/status
// @access  Private
export const updateBookingStatus = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('turf');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const canEdit =
            req.user.role === 'SuperAdmin' ||
            booking.user.toString() === req.user._id.toString() ||
            (req.user.role === 'TurfOwner' && booking.turf.owner.toString() === req.user._id.toString());

        if (!canEdit) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        booking.bookingStatus = req.body.status || booking.bookingStatus;
        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a booking details
// @route   PUT /api/bookings/:id
// @access  Private/TurfOwner
export const updateBooking = async (req, res) => {
    try {
        const { advanceAmount, paymentAccount, bookerName, bookingStatus } = req.body;
        const booking = await Booking.findById(req.params.id).populate('turf');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (req.user.role === 'TurfOwner' && booking.turf.owner.toString() === req.user._id.toString()) {
            if (advanceAmount !== undefined) booking.advanceAmount = advanceAmount;
            if (paymentAccount !== undefined) booking.paymentAccount = paymentAccount;
            if (bookerName !== undefined) booking.bookerName = bookerName;
            if (bookingStatus !== undefined) booking.bookingStatus = bookingStatus;

            const updatedBooking = await booking.save();
            res.json(updatedBooking);
        } else {
            return res.status(401).json({ message: 'Not authorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/TurfOwner
export const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('turf');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (req.user.role === 'TurfOwner' && booking.turf.owner.toString() === req.user._id.toString()) {
            await booking.deleteOne();
            res.json({ message: 'Booking removed' });
        } else {
            return res.status(401).json({ message: 'Not authorized' });
        }
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

