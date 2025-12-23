import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Need to create optional Textarea or use Input
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const TaskForm = ({ task, onSuccess, onCancel }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [assignedTo, setAssignedTo] = useState('');
    const [users, setUsers] = useState([]);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            if (user?.role !== 'admin') return;
            try {
                const { data } = await api.get('/auth/users');
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            }
        };
        fetchUsers();
    }, [user]);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
            setPriority(task.priority);
            setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
        }
    }, [task]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const taskData = {
                title,
                description,
                dueDate,
                priority,
                // Only include assignedTo if admin, otherwise let backend handle default (or keep existing for update)
                ...(user.role === 'admin' && { assignedTo }),
            };

            if (task) {
                await api.put(`/tasks/${task._id}`, taskData);
                toast({ title: 'Task updated' });
            } else {
                await api.post('/tasks', taskData);
                toast({ title: 'Task created' });
            }
            onSuccess();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Something went wrong',
                variant: 'destructive',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {user?.role === 'admin' && (
                <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assign To</Label>
                    <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((u) => (
                                <SelectItem key={u._id} value={u._id}>
                                    {u.name} ({u.email})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">{task ? 'Update' : 'Create'} Task</Button>
            </DialogFooter>
        </form>
    );
};

export default TaskForm;
