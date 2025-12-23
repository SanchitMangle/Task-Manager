import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="border-b bg-background sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-primary mr-6">
                            TaskMaster
                        </Link>
                        {user && user.role === 'admin' && (
                            <Link to="/users">
                                <Button variant="ghost">Users</Button>
                            </Link>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{user.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={logout}>
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <div className="space-x-2">
                                <Link to="/login">
                                    <Button variant="ghost">Login</Button>
                                </Link>
                                <Link to="/register">
                                    <Button>Register</Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
