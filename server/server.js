import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { errorHandler } from './middleware/error.middleware.js';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Base Route
app.get('/', (req, res) => res.send('API is running...'));

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(port, () => console.log(`Server started on port ${port}`));
