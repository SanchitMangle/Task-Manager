import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import TaskForm from '@/components/TaskForm';
import { Plus, Pencil, Trash2, Eye, CheckCircle, XCircle, Search, RefreshCw, X } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const { user } = useAuth();
    const { toast } = useToast();

    const [priorityFilter, setPriorityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [limit, setLimit] = useState(5);

    // ... existing hooks

    const fetchTasks = async (pageNum = 1) => {
        setLoading(true);
        try {
            let url = `/tasks?page=${pageNum}&limit=${limit}`;
            if (priorityFilter !== 'all') {
                url += `&priority=${priorityFilter}`;
            }
            if (statusFilter !== 'all') {
                url += `&status=${statusFilter}`;
            }
            if (searchQuery) {
                url += `&search=${encodeURIComponent(searchQuery)}`;
            }
            const { data } = await api.get(url);
            setTasks(data.tasks);
            setTotalPages(data.totalPages);
            setPage(data.currentPage);
        } catch (error) {
            console.error(error);
            toast({ title: 'Failed to fetch tasks', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTasks(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, limit]); // Added limit dependency

    useEffect(() => {
        fetchTasks(1); // Reset to page 1 for other filters
    }, [priorityFilter, statusFilter, limit]); // Added limit dependency

    // Handle pagination separately
    useEffect(() => {
        if (page > 1 || (page === 1 && !loading)) { // Avoid double fetch on init/filter change
            fetchTasks(page);
        }
    }, [page]);

    // Filter tasks locally for the view since we are paginating (might be weird if page 1 has no High tasks)
    // Correct approach: Update Backend to support filtering.

    const handleCreateSuccess = () => {
        setIsCreateOpen(false);
        fetchTasks(1);
    };

    const handleEditSuccess = () => {
        setEditingTask(null);
        fetchTasks(page);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        try {
            await api.delete(`/tasks/${deletingId}`);
            toast({ title: 'Task deleted' });
            fetchTasks(page);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete',
                variant: 'destructive'
            });
        } finally {
            setDeletingId(null);
        }
    };

    const toggleStatus = async (task) => {
        try {
            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
            await api.put(`/tasks/${task._id}`, { status: newStatus });

            // Optimistic update
            setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
            toast({ title: `Task marked as ${newStatus}` });
        } catch (error) {
            toast({ title: 'Update failed', variant: 'destructive' });
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500 hover:bg-red-600';
            case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'low': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-gray-500';
        }
    };

    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // ... (existing helper functions)

    const fetchStats = async () => {
        if (user?.role !== 'admin') return;
        setStatsLoading(true);
        try {
            const { data } = await api.get('/tasks/stats');
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchStats();
        }
    }, [user, tasks]); // Re-fetch stats when tasks change

    const renderAdminStats = () => {
        if (!stats) return null;

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalTasks}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Completed: {stats.status?.completed || 0}<br />
                            Pending: {stats.status?.pending || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Priority Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            High: {stats.priority?.high || 0}, Med: {stats.priority?.medium || 0}, Low: {stats.priority?.low || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-1 md:col-span-2 lg:col-span-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Top Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {stats.users?.slice(0, 3).map(u => (
                                <div key={u._id} className="text-xs flex justify-between">
                                    <span className="truncate max-w-[100px]">{u.name}</span>
                                    <span className="text-muted-foreground">{u.count} tasks</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    const handleRefresh = () => {
        fetchTasks(page);
        if (user?.role === 'admin') fetchStats();
    };

    const handleClearFilters = () => {
        setPriorityFilter('all');
        setStatusFilter('all');
        setSearchQuery('');
        setPage(1);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-7rem)] space-y-4">
            <div className="flex-none py-4 border-b">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Task
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                            </DialogHeader>
                            <TaskForm
                                onSuccess={handleCreateSuccess}
                                onCancel={() => setIsCreateOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <Tabs defaultValue="all" onValueChange={setPriorityFilter} className="w-full md:w-auto">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="high">High</TabsTrigger>
                            <TabsTrigger value="medium">Medium</TabsTrigger>
                            <TabsTrigger value="low">Low</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search tasks..."
                                className="pl-8 w-full md:w-[200px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={handleClearFilters}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-md border relative bg-background">
                <table className="w-full caption-bottom text-sm text-left">
                    <TableHeader className="sticky top-0 z-20 bg-background shadow-sm hover:bg-background">
                        <TableRow className="hover:bg-transparent border-b transition-colors data-[state=selected]:bg-muted">
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground bg-background">Title</TableHead>
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground bg-background">Due Date</TableHead>
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground bg-background">Priority</TableHead>
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground bg-background">Status</TableHead>
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground bg-background">Assigned To</TableHead>
                            <TableHead className="h-12 px-4 align-middle font-medium text-muted-foreground text-right bg-background">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px] ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : tasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No tasks found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            tasks.map((task) => (
                                <TableRow key={task._id}>
                                    <TableCell className="font-medium">
                                        <div className="truncate max-w-[200px]" title={task.title}>
                                            {task.title}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getPriorityColor(task.priority)}>
                                            {task.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'} className="cursor-pointer" onClick={() => toggleStatus(task)}>
                                            {task.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {task.assignedTo?.name || 'Unassigned'}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link to={`/tasks/${task._id}`}>
                                            <Button variant="ghost" size="icon" title="View Details">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingTask(task)}
                                            disabled={!(user?.role === 'admin' || task.createdBy?._id === user._id || task.assignedTo?._id === user._id)}
                                            title={!(user?.role === 'admin' || task.createdBy?._id === user._id || task.assignedTo?._id === user._id) ? "You cannot edit this task" : "Edit"}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => setDeletingId(task._id)}
                                            disabled={!(user?.role === 'admin' || task.createdBy?._id === user._id)}
                                            title={!(user?.role === 'admin' || task.createdBy?._id === user._id) ? "Only admin or creator can delete" : "Delete"}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </table>
            </div>

            <div className="flex-none py-2 flex items-center justify-between px-4">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${limit}`}
                        onValueChange={(value) => {
                            setLimit(Number(value));
                            setPage(1); // Reset to page 1 when changing limit
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={limit} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 10, 20, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination className="w-auto mx-0">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        isActive={page === i + 1}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}
            </div>

            {/* Edit Dialog - kept same */}
            <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                    </DialogHeader>
                    {editingTask && (
                        <TaskForm
                            task={editingTask}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setEditingTask(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert - kept same */}
            <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Dashboard;
