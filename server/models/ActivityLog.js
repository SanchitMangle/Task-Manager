import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'deleted', 'status_changed', 'priority_changed', 'assigned'],
    },
    details: {
        type: String,
    },
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
