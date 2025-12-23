import express from 'express';
import {
    createTask,
    getTasks,
    getTask,
    updateTask,
    deleteTask,
    getTaskStats,
    getTaskLogs,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.get('/stats', protect, getTaskStats);
router.get('/:id/logs', protect, getTaskLogs);

router.route('/:id')
    .get(protect, getTask)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

export default router;
