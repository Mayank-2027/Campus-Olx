import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingBag, MessageCircle, Search, Bell, Menu, X,
    LogOut, User, LayoutDashboard, Shield, Package, AlertCircle,
    ChevronDown, CheckCircle
} from 'lucide-react';
import { chatsAPI } from '../api';

const Navbar = () => {
    const { user, isAuthenticated, isAdmin, logout, loginWithGoogle } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const isLanding = location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isAuthenticated) {
            chatsAPI.getChats().then(({ data }) => {
                const total = data.chats?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;
                setUnreadCount(total);
            }).catch(() => { });
        }
    }, [isAuthenticated, location.pathname]);

    const navBg = isLanding
        ? scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'
        : 'bg-white shadow-sm';

    const navLinks = [
        { to: '/marketplace', label: 'Browse', icon: <Search size={16} /> },
        { to: '/lost-found', label: 'Lost & Found', icon: <AlertCircle size={16} /> },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-300 transition-all">
                            <ShoppingBag size={18} className="text-white" />
                        </div>
                        <span className="text-xl font-black text-gray-900 tracking-tight">
                            Campus<span className="text-indigo-600">OLX</span>
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname.startsWith(link.to)
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.icon} {link.label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated ? (
                            <>
                                {/* Chat icon */}
                                <Link
                                    to="/chats"
                                    className="relative p-2 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                >
                                    <MessageCircle size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Link>

                                {/* Profile dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setProfileOpen(!profileOpen)}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all"
                                    >
                                        <img
                                            src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff`}
                                            alt={user?.name}
                                            className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-100"
                                        />
                                        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-24 truncate">
                                            {user?.name?.split(' ')[0]}
                                        </span>
                                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {profileOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-fade-in">
                                            {/* User info */}
                                            <div className="px-4 py-3 border-b border-gray-50">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                                <div className="flex items-center gap-1 mt-1.5">
                                                    {user?.isVerifiedSeller && (
                                                        <span className="badge-green text-xs">
                                                            <CheckCircle size={10} /> Verified Seller
                                                        </span>
                                                    )}
                                                    {user?.isAdmin && (
                                                        <span className="badge-indigo text-xs">
                                                            <Shield size={10} /> Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                <LayoutDashboard size={15} /> Dashboard
                                            </Link>
                                            <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                <User size={15} /> My Profile
                                            </Link>
                                            {user?.isVerifiedSeller && (
                                                <Link to="/my-listings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                                                    <Package size={15} /> My Listings
                                                </Link>
                                            )}
                                            {!user?.isVerifiedSeller && !user?.isAdmin && (
                                                <Link to="/become-seller" className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 font-medium hover:bg-indigo-50 transition-colors">
                                                    <CheckCircle size={15} /> Become a Seller
                                                </Link>
                                            )}
                                            {isAdmin && (
                                                <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-700 font-medium hover:bg-indigo-50 transition-colors">
                                                    <Shield size={15} /> Admin Panel
                                                </Link>
                                            )}

                                            <div className="border-t border-gray-100 mt-1">
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <LogOut size={15} /> Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={loginWithGoogle}
                                className="btn-primary text-sm py-2 px-5"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Login with Google
                            </button>
                        )}

                        {/* Mobile menu */}
                        <button
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            {link.icon} {link.label}
                        </Link>
                    ))}
                    {isAuthenticated && (
                        <>
                            <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <Link to="/chats" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600">
                                <MessageCircle size={16} /> Chats {unreadCount > 0 && <span className="badge-red">{unreadCount}</span>}
                            </Link>
                            {isAdmin && (
                                <Link to="/admin" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-indigo-600 font-medium hover:bg-indigo-50">
                                    <Shield size={16} /> Admin Panel
                                </Link>
                            )}
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
