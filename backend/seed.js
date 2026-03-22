import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Turf from './models/Turf.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/turfbooking');

        console.log('Connected to MongoDB. Clearing existing data...');
        await User.deleteMany();
        await Turf.deleteMany();

        console.log('Creating Seed Users...');

        const salt = await bcrypt.genSalt(10);
        const adminHashedPassword = await bcrypt.hash('9876543211', salt);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const adminUser = await User.create({
            name: 'Super Admin',
            phone: '9876543211',
            password: adminHashedPassword,
            role: 'SuperAdmin'
        });

        const ownerUser = await User.create({
            name: 'Turf Owner John',
            phone: '8888888888',
            password: hashedPassword,
            role: 'TurfOwner'
        });

        const customerUser = await User.create({
            name: 'Customer Dave',
            phone: '7777777777',
            password: hashedPassword,
            role: 'Customer'
        });

        console.log('Creating Seed Turfs...');

        await Turf.insertMany([
            {
                name: 'Premium Green Arena',
                owner: ownerUser._id,
                location: { address: '123 Main St', city: 'Mumbai' },
                pricePerHour: 1200,
                sportTypes: ['Football', 'Cricket'],
                images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1000&auto=format&fit=crop'],
                status: 'Active'
            },
            {
                name: 'Elite Sports Complex',
                owner: ownerUser._id,
                location: { address: '456 West Avenue', city: 'Delhi' },
                pricePerHour: 1500,
                sportTypes: ['Football', 'Tennis'],
                images: ['https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=1000&auto=format&fit=crop'],
                status: 'Active'
            },
            {
                name: 'City Center Turf',
                owner: ownerUser._id,
                location: { address: '789 East Blvd', city: 'Bangalore' },
                pricePerHour: 1000,
                sportTypes: ['Cricket'],
                images: ['https://images.unsplash.com/photo-1531415074968-03611b678135?q=80&w=1000&auto=format&fit=crop'],
                status: 'Active'
            }
        ]);

        console.log('Database successfully seeded!');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
