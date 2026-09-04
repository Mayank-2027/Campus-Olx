import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    // Fetch current user on mount
    useEffect(() => {
        if (localStorage.getItem('token')) {
            checkAuth();
        } else {
            setLoading(false);
        }
    }, []);

    // Initialize socket when user is authenticated
    useEffect(() => {
        if (user && !socketRef.current) {
            const newSocket = io(
                import.meta.env.VITE_SOCKET_URL ||
                'https://campus-olx-13aq.onrender.com',
                {
                    withCredentials: true
                }
            );

            newSocket.on('connect', () => {
                newSocket.emit('join', user._id);
                if (user.isAdmin) {
                    newSocket.emit('joinAdmin');
                }
            });

            // Handle verification notifications
            newSocket.on('verificationApproved', (data) => {
                toast.success(data.message, { duration: 6000, icon: '🎉' });
                checkAuth(); // Refresh user data
            });

            newSocket.on('verificationRejected', (data) => {
                toast.error(data.message, { duration: 6000 });
                checkAuth();
            });

            // Handle general notifications from server
            newSocket.on('newNotification', (data) => {
                console.log('[FRONTEND DEBUG] 🔔 newNotification received via socket:', data);
                toast(data.message || data.title, {
                    icon: '🔔',
                    duration: 5000,
                });
            });

            newSocket.on('disconnect', () => {
                console.log('[FRONTEND DEBUG] Socket disconnected');
            });

            newSocket.on('connect_error', (err) => {
                console.error('[FRONTEND DEBUG] Socket connect error:', err.message);
            });

            socketRef.current = newSocket;
            setSocket(newSocket);
        }

        return () => {
            if (socketRef.current && !user) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [user]);

    const checkAuth = async () => {
        try {
            const { data } = await authAPI.status();
            if (data.isAuthenticated && data.user) {
                setUser(data.user);
            } else {
                setUser(null);
            }
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            localStorage.removeItem('token');
            setUser(null);
            window.location.href = '/';
        } catch (err) {
            toast.error('Logout failed');
        }
    };

    const loginWithGoogle = () => {
        window.location.href = authAPI.googleLoginUrl;
    };

    const refreshUser = () => checkAuth();

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            socket,
            logout,
            loginWithGoogle,
            refreshUser,
            isAuthenticated: !!user,
            isAdmin: user?.isAdmin || false,
            isVerifiedSeller: user?.isVerifiedSeller || false,
            isProfileComplete: user?.isProfileComplete || false,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
