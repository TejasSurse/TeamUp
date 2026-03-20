import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import compression from 'compression';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import turfRoutes from './routes/turfRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import paymentAccountRoutes from './routes/paymentAccountRoutes.js';

dotenv.config();
connectDB();

const app = express();

// ── Gzip/Brotli compression (reduces response size 60-70%)
app.use(compression());

// ── CORS: open to all origins (change to whitelist when ready for production lock-down)
app.use(cors());

app.use(express.json({ limit: '5mb' }));

// ── Basic security headers (no helmet needed)
app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// ── Simple in-memory rate limiter (100 req / IP / minute)
const rateLimitMap = new Map();
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const limit = 100;
    const entry = rateLimitMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
    entry.count++;
    rateLimitMap.set(ip, entry);
    if (entry.count > limit) return res.status(429).json({ message: 'Too many requests, slow down.' });
    next();
});

// Database Connection Guard: Ensures data loads before responding
app.use(async (req, res, next) => {
    // Skip check for health endpoint
    if (req.path === '/api/health') return next();

    try {
        const state = mongoose.connection.readyState;
        
        // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        if (state !== 1) {
            console.log(`DB not ready (state: ${state}). Attempting to connect...`);
            await connectDB();
        }
        next();
    } catch (error) {
        console.error('Database connection guard failed:', error.message);
        res.status(503).json({ 
            message: 'Database connection failed. Please check your MONGO_URI or database availability.',
            error: error.message
        });
    }
});

// Health check (Enhanced with DB status)
app.get('/api/health', (_req, res) => {
    res.json({ 
        status: 'UP', 
        db: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'FAIL',
        ts: Date.now() 
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/payment-accounts', paymentAccountRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
