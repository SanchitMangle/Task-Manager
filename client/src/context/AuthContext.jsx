import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                } catch (error) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkUser();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            toast({ title: 'Success', description: 'Logged in successfully' });
            return true;
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Login failed',
                variant: 'destructive',
            });
            return false;
        }
    };

    const register = async (name, email, password) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('token', data.token);
            setUser(data);
            toast({ title: 'Success', description: 'Registered successfully' });
            return true;
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Registration failed',
                variant: 'destructive',
            });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        toast({ title: 'Logged out', description: 'See you soon!' });
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
