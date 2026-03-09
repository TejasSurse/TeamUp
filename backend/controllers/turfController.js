import Turf from '../models/Turf.js';

// @desc    Fetch all active turfs (supports filtering by city/location)
// @route   GET /api/turfs
// @access  Public
export const getTurfs = async (req, res) => {
    try {
        const { city } = req.query;
        let query = { status: 'Active' };

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        const turfs = await Turf.find(query);
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
