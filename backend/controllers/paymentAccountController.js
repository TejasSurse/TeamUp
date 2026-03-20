import PaymentAccount from '../models/PaymentAccount.js';

export const createAccount = async (req, res) => {
    try {
        const { name } = req.body;
        const newAccount = new PaymentAccount({
            owner: req.user._id,
            name
        });
        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAccounts = async (req, res) => {
    try {
        const accounts = await PaymentAccount.find({ owner: req.user._id });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteAccount = async (req, res) => {
    try {
        const account = await PaymentAccount.findById(req.params.id);
        if (!account || account.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Account not found or unauthorized' });
        }
        await account.deleteOne();
        res.json({ message: 'Account removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
