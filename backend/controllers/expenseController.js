import Expense from '../models/Expense.js';

export const createExpense = async (req, res) => {
    try {
        const { turfId, note, amount, date } = req.body;
        const newExpense = new Expense({
            turf: turfId || null,
            owner: req.user._id,
            note,
            amount: Number(amount),
            date
        });
        const savedExpense = await newExpense.save();
        res.status(201).json(savedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ owner: req.user._id }).sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense || expense.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Expense not found or unauthorized' });
        }
        
        expense.note = req.body.note || expense.note;
        expense.amount = req.body.amount !== undefined ? Number(req.body.amount) : expense.amount;
        expense.date = req.body.date || expense.date;
        if (req.body.turfId !== undefined) {
            expense.turf = req.body.turfId || null;
        }

        const updatedExpense = await expense.save();
        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense || expense.owner.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Expense not found or unauthorized' });
        }
        await expense.deleteOne();
        res.json({ message: 'Expense removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
