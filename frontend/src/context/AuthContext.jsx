import { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import BallLoader from '../components/BallLoader';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            delete api.defaults.headers.common['Authorization'];
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (phone, password) => {
        const { data } = await api.post('/auth/login', { phone, password });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
    };

    const register = async (name, phone, password, role) => {
        const { data } = await api.post('/auth/register', { name, phone, password, role });
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    // Don't render children until auth state is determined
    if (loading) {
        return <BallLoader />;
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
