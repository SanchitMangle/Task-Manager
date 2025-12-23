import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Tag, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TaskDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const { data } = await api.get(`/tasks/${id}`);
                setTask(data);
            } catch (err) {
                setError('Failed to load task');
            } finally {
                setLoading(false);
            }
        };

        const fetchLogs = async () => {
            setLogsLoading(true);
            try {
                const { data } = await api.get(`/tasks/${id}/logs`);
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch logs', error);
            } finally {
                setLogsLoading(false);
            }
        };

        fetchTask();
        fetchLogs();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="space-y-4 w-full max-w-2xl">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="text-center mt-10">
                <h2 className="text-xl font-bold text-destructive">Task not found</h2>
                <Link to="/">
                    <Button variant="link">Go back to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500 hover:bg-red-600';
            case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'low': return 'bg-green-500 hover:bg-green-600';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            <Tabs defaultValue="details" className="max-w-3xl mx-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-2xl font-bold">{task.title}</CardTitle>
                                <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center text-muted-foreground">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <span className="font-medium text-foreground mr-2">Due Date:</span>
                                        {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'No due date'}
                                    </div>

                                    <div className="flex items-center text-muted-foreground">
                                        <User className="mr-2 h-4 w-4" />
                                        <span className="font-medium text-foreground mr-2">Assigned To:</span>
                                        {task.assignedTo?.name || 'Unassigned'}
                                    </div>

                                    <div className="flex items-center text-muted-foreground">
                                        <Tag className="mr-2 h-4 w-4" />
                                        <span className="font-medium text-foreground mr-2">Status:</span>
                                        <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'}>
                                            {task.status === 'completed' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                                            {task.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert">
                                    <h3 className="text-sm font-medium mb-2">Description</h3>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {task.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {logsLoading ? (
                                    <Skeleton className="h-[100px] w-full" />
                                ) : logs.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No activity recorded for this task.</p>
                                ) : (
                                    logs.map((log) => (
                                        <div key={log._id} className="flex flex-col space-y-1 border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-sm">{log.user?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{log.details}</p>
                                            <Badge variant="outline" className="w-fit text-[10px] px-1 py-0">{log.action}</Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TaskDetailsPage;
