import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../api';
import {
    Plus, Package, MessageCircle, Search, ShoppingBag,
    CheckCircle, Clock, AlertCircle, TrendingUp, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_LINKS = [
    { to: '/marketplace', icon: <Search size={20} />, label: 'Browse Items', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { to: '/chats', icon: <MessageCircle size={20} />, label: 'My Chats', color: 'bg-green-50 text-green-600 border-green-200' },
    { to: '/lost-found', icon: <AlertCircle size={20} />, label: 'Lost & Found', color: 'bg-amber-50 text-amber-600 border-amber-200' },
];

const Dashboard = () => {
    const { user, isVerifiedSeller, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isVerifiedSeller) {
            productsAPI.getMyListings()
                .then(({ data }) => setMyListings(data.products || []))
                .catch(() => { })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isVerifiedSeller]);

    const activeCount = myListings.filter(p => p.status === 'available').length;
    const soldCount = myListings.filter(p => p.status === 'sold').length;

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">

                {/* Welcome */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <img
                            src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff&size=80`}
                            alt={user?.name}
                            className="w-14 h-14 rounded-full ring-4 ring-indigo-100 object-cover"
                        />
                        <div>
                            <h1 className="text-2xl font-black text-gray-900">
                                Welcome back, {user?.name?.split(' ')[0]}! 👋
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-500">{user?.branchFull} • {user?.year} Year</span>
                                {isVerifiedSeller && (
                                    <span className="badge-green text-xs">
                                        <CheckCircle size={10} /> Verified Seller
                                    </span>
                                )}
                                {isAdmin && (
                                    <span className="badge-indigo text-xs">Admin</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats (for sellers) */}
                {isVerifiedSeller && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                        <div className="card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{activeCount}</p>
                                    <p className="text-xs text-gray-500">Active Listings</p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{soldCount}</p>
                                    <p className="text-xs text-gray-500">Items Sold</p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-5 col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Package size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{myListings.length}</p>
                                    <p className="text-xs text-gray-500">Total Listings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Become a seller banner */}
                {!isVerifiedSeller && !isAdmin && user?.verificationStatus !== 'pending' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="font-bold text-xl mb-1">Want to sell on CampusOLX?</h2>
                            <p className="text-indigo-100 text-sm">Get verified and start listing your items in minutes</p>
                        </div>
                        <Link to="/become-seller" className="bg-white text-indigo-600 font-semibold py-2.5 px-6 rounded-full hover:shadow-lg transition-all whitespace-nowrap">
                            Become a Seller →
                        </Link>
                    </div>
                )}

                {/* Pending verification */}
                {user?.verificationStatus === 'pending' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock size={24} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-amber-800">Verification Under Review</h2>
                            <p className="text-amber-600 text-sm">Your ID is being reviewed by our admin team. You'll be notified once approved.</p>
                        </div>
                    </div>
                )}

                {/* Admin shortcut */}
                {isAdmin && (
                    <div className="bg-indigo-600 rounded-2xl p-6 mb-8 text-white flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-xl">Admin Panel</h2>
                            <p className="text-indigo-100 text-sm">Manage users, verifications, and reports</p>
                        </div>
                        <Link to="/admin" className="bg-white text-indigo-600 font-semibold py-2.5 px-6 rounded-full hover:shadow-lg transition-all">
                            Open Admin →
                        </Link>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Quick links */}
                    <div>
                        <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {QUICK_LINKS.map(link => (
                                <Link key={link.to} to={link.to}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 ${link.color} transition-all hover:shadow-sm`}>
                                    {link.icon}
                                    <span className="font-medium">{link.label}</span>
                                    <ArrowRight size={16} className="ml-auto" />
                                </Link>
                            ))}
                            {isVerifiedSeller && (
                                <Link to="/create-listing"
                                    className="flex items-center gap-3 p-4 rounded-xl border-2 bg-indigo-600 text-white border-indigo-600 transition-all hover:shadow-lg">
                                    <Plus size={20} />
                                    <span className="font-medium">Create New Listing</span>
                                    <ArrowRight size={16} className="ml-auto" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Recent listings */}
                    <div className="lg:col-span-2">
                        {isVerifiedSeller ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="font-bold text-gray-900">My Recent Listings</h2>
                                    <Link to="/my-listings" className="text-sm text-indigo-600 hover:underline">View all</Link>
                                </div>
                                {loading ? (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="card p-4">
                                                <div className="skeleton h-32 rounded-lg mb-3" />
                                                <div className="skeleton h-4 w-3/4 rounded mb-2" />
                                                <div className="skeleton h-4 w-1/2 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : myListings.length === 0 ? (
                                    <div className="card p-12 text-center">
                                        <ShoppingBag size={32} className="text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No listings yet</p>
                                        <Link to="/create-listing" className="btn-primary mt-4 inline-flex">
                                            <Plus size={16} /> Create First Listing
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {myListings.slice(0, 4).map(product => (
                                            <Link key={product._id} to={`/product/${product._id}`} className="card p-4 block hover:-translate-y-0.5 transition-transform">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt={product.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                                        <ShoppingBag size={24} className="text-gray-300" />
                                                    </div>
                                                )}
                                                <p className="font-semibold text-gray-900 text-sm truncate">{product.title}</p>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-indigo-600 font-bold">₹{product.price.toLocaleString()}</p>
                                                    <span className={`badge text-xs ${product.status === 'available' ? 'badge-green' :
                                                            product.status === 'sold' ? 'badge-gray' : 'badge-yellow'
                                                        }`}>
                                                        {product.status}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <h2 className="font-bold text-gray-900 mb-4">Explore Campus</h2>
                                <div className="card p-8 text-center">
                                    <Search size={32} className="text-indigo-300 mx-auto mb-3" />
                                    <p className="text-gray-600 mb-4">Discover items being sold by students on your campus</p>
                                    <Link to="/marketplace" className="btn-primary">
                                        Browse Marketplace <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
