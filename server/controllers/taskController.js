import Task from '../models/Task.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
    try {
        const { title, description, dueDate, priority, status, assignedTo } = req.body;

        if (!title) {
            res.status(400);
            throw new Error('Please add a task title');
        }

        // Only admin can assign tasks to others
        // If not admin, force assignment to self
        const taskAssignedTo = (req.user.role === 'admin' && assignedTo) ? assignedTo : req.user.id;

        const task = await Task.create({
            title,
            description,
            dueDate,
            priority,
            status,
            assignedTo: taskAssignedTo,
            createdBy: req.user.id,
        });

        await ActivityLog.create({
            user: req.user.id,
            task: task._id,
            action: 'created',
            details: `Task created by ${req.user.name}`
        });

        res.status(201).json(task);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks with pagination and filtering
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // If user is not admin, they can only see tasks assigned to them or created by them
        if (req.user.role !== 'admin') {
            query.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
        }

        if (req.query.priority && req.query.priority !== 'all') {
            query.priority = req.query.priority;
        }

        if (req.query.status && req.query.status !== 'all') {
            query.status = req.query.status;
        }

        if (req.query.search) {
            query.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
            ];
            // Need to ensure user restriction still applies with $or
            if (req.user.role !== 'admin') {
                // Complex query: (title matches OR desc matches) AND (assignedTo is me OR createdBy is me)
                query.$and = [
                    { $or: [{ assignedTo: req.user.id }, { createdBy: req.user.id }] },
                    {
                        $or: [
                            { title: { $regex: req.query.search, $options: 'i' } },
                            { description: { $regex: req.query.search, $options: 'i' } }
                        ]
                    }
                ];
                delete query.$or; // Remove top-level $or from the first check
            }
        }

        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalTasks = await Task.countDocuments(query);

        res.status(200).json({
            tasks,
            totalTasks,
            totalPages: Math.ceil(totalTasks / limit),
            currentPage: page,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
export const getTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        // Check if user is authorized to view this task
        if (
            req.user.role !== 'admin' &&
            task.assignedTo._id.toString() !== req.user.id &&
            task.createdBy._id.toString() !== req.user.id
        ) {
            res.status(401);
            throw new Error('User not authorized');
        }

        res.status(200).json(task);
    } catch (error) {
        next(error);
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        // Check if user is authorized to update this task
        // Admin can update any task
        // Users can update tasks assigned to them or created by them
        if (
            req.user.role !== 'admin' &&
            task.assignedTo.toString() !== req.user.id &&
            task.createdBy.toString() !== req.user.id
        ) {
            res.status(401);
            throw new Error('User not authorized');
        }

        // Prevent non-admins from changing the assignee
        if (req.user.role !== 'admin' && req.body.assignedTo) {
            delete req.body.assignedTo;
        }

        const previousStatus = task.status;
        const previousPriority = task.priority;

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        // Log actions
        if (req.body.status && req.body.status !== previousStatus) {
            await ActivityLog.create({
                user: req.user.id,
                task: task._id,
                action: 'status_changed',
                details: `Status changed from ${previousStatus} to ${req.body.status}`
            });
        } else if (req.body.priority && req.body.priority !== previousPriority) {
            await ActivityLog.create({
                user: req.user.id,
                task: task._id,
                action: 'priority_changed',
                details: `Priority changed from ${previousPriority} to ${req.body.priority}`
            });
        } else {
            await ActivityLog.create({
                user: req.user.id,
                task: task._id,
                action: 'updated',
                details: 'Task details updated'
            });
        }

        res.status(200).json(updatedTask);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404);
            throw new Error('Task not found');
        }

        // Check if user is authorized to delete this task
        // Only Admin or Creator can delete
        if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
            res.status(401);
            throw new Error('User not authorized to delete this task');
        }

        await ActivityLog.create({
            user: req.user.id,
            task: task._id,
            action: 'deleted',
            details: `Task deleted by ${req.user.name}`
        });

        await task.deleteOne();

        res.status(200).json({ id: req.params.id });
    } catch (error) {
        next(error);
    }
};

// @desc    Get task statistics (Admin only)
// @route   GET /api/tasks/stats
// @access  Private/Admin
export const getTaskStats = async (req, res, next) => {
    try {
        // Ensure only admin can access
        if (req.user.role !== 'admin') {
            res.status(401);
            throw new Error('Not authorized as an admin');
        }

        const totalTasks = await Task.countDocuments();

        const statusStats = await Task.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const priorityStats = await Task.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const userStats = await Task.aggregate([
            {
                $group: {
                    _id: '$assignedTo',
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    },
                    pending: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    name: '$user.name',
                    email: '$user.email',
                    count: 1,
                    completed: 1,
                    pending: 1
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            totalTasks,
            status: statusStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            priority: priorityStats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
            users: userStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get task logs
// @route   GET /api/tasks/:id/logs
// @access  Private
export const getTaskLogs = async (req, res, next) => {
    try {
        const logs = await ActivityLog.find({ task: req.params.id })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(logs);
    } catch (error) {
        next(error);
    }
};
