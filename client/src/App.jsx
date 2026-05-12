import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import BecomeSeller from './pages/BecomeSeller';
import LostFound from './pages/LostFound';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import Chats from './pages/Chats';
import ChatDetail from './pages/ChatDetail';
import Profile from './pages/Profile';
import LoginSuccess from './pages/LoginSuccess';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerifications from './pages/admin/AdminVerifications';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLostFound from './pages/admin/AdminLostFound';
import AdminLogs from './pages/admin/AdminLogs';

import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Route Guards
const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, isProfileComplete } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isProfileComplete) return <Navigate to="/complete-profile" replace />;
    return children;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, loading, isAdmin } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return children;
};

const PublicOnlyRoute = ({ children }) => {
    const { isAuthenticated, loading, isProfileComplete } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;
    if (isAuthenticated && isProfileComplete) return <Navigate to="/dashboard" replace />;
    return children;
};

const AppRoutes = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingSpinner fullPage />;

    return (
        <>
            <Navbar />
            <div className="min-h-screen">
                <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/marketplace/category/:cat" element={<Marketplace />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/lost-found" element={<LostFound />} />
                    <Route path="/login-success" element={<LoginSuccess />} />

                    {/* Profile completion (authenticated but no profile) */}
                    <Route path="/complete-profile" element={
                        isAuthenticated ? <CompleteProfile /> : <Navigate to="/login" replace />
                    } />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                    <Route path="/create-listing" element={<PrivateRoute><CreateListing /></PrivateRoute>} />
                    <Route path="/edit-listing/:id" element={<PrivateRoute><EditListing /></PrivateRoute>} />
                    <Route path="/my-listings" element={<PrivateRoute><MyListings /></PrivateRoute>} />
                    <Route path="/become-seller" element={<PrivateRoute><BecomeSeller /></PrivateRoute>} />
                    <Route path="/lost-found/report-lost" element={<PrivateRoute><ReportLost /></PrivateRoute>} />
                    <Route path="/lost-found/report-found" element={<PrivateRoute><ReportFound /></PrivateRoute>} />
                    <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
                    <Route path="/chat/:id" element={<PrivateRoute><ChatDetail /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/admin/verifications" element={<AdminRoute><AdminVerifications /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/lost-found" element={<AdminRoute><AdminLostFound /></AdminRoute>} />
                    <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />

                    {/* 404 */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#1f2937',
                            color: '#f9fafb',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                        },
                        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
