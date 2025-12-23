import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Task from '../models/Task.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany({});
        await Task.deleteMany({});
        console.log('Data cleared');

        // Create Admin
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('qwerty123', salt);

        const adminUser = await User.create({
            name: 'admin',
            email: 'admin@task.com',
            password: hashedAdminPassword,
            role: 'admin'
        });
        console.log('Admin created');

        // Create 10 Users
        const users = [];
        const hashedUserPassword = await bcrypt.hash('123456', salt);

        for (let i = 1; i <= 10; i++) {
            users.push({
                name: `User ${i}`,
                email: `user${i}@example.com`,
                password: hashedUserPassword,
                role: 'user'
            });
        }

        const createdUsers = await User.insertMany(users);
        console.log('10 Users created');

        // Create 20 Tasks
        const tasks = [];
        const priorities = ['low', 'medium', 'high'];
        const statuses = ['pending', 'completed'];

        // Add admin to potential assignees
        const allUsers = [adminUser, ...createdUsers];

        for (let i = 1; i <= 20; i++) {
            // Randomly assign creator (mostly admin for demo)
            const creator = i % 4 === 0 ? createdUsers[Math.floor(Math.random() * createdUsers.length)] : adminUser;
            // Randomly assign to any user
            const assignee = allUsers[Math.floor(Math.random() * allUsers.length)];

            // Random due date within next 30 days
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30));

            tasks.push({
                title: `Demo Task ${i} - ${assignee.name}'s Assignment`,
                description: `This is a detailed description for demo task number ${i}. It involves connecting the backend to the frontend and testing various edge cases.`,
                dueDate: dueDate,
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                assignedTo: assignee._id,
                createdBy: creator._id
            });
        }

        await Task.insertMany(tasks);
        console.log('20 Tasks created');

        console.log('Database seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
