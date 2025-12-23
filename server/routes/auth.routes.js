import express from 'express';
import { registerUser, loginUser, getMe, getAllUsers, deleteUser } from '../controllers/authController.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, getAllUsers);
router.delete('/:id', protect, admin, deleteUser);


export default router;
