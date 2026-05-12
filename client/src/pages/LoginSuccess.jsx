import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshUser } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('token', token);
            // Refresh the user state in AuthContext
            refreshUser().then(() => {
                navigate('/dashboard', { replace: true });
            });
        } else {
            navigate('/login', { replace: true });
        }
    }, [location, navigate, refreshUser]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 font-medium">Completing login...</p>
            </div>
        </div>
    );
};

export default LoginSuccess;
