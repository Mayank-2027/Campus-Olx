import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api';
import { Users, Shield, Flag, Package, Search, FileText, BarChart2 } from 'lucide-react';

const ADMIN_LINKS = [
    { to: '/admin/verifications', icon: <Shield size={20} />, label: 'Verifications', key: 'pendingVerifications', color: 'text-indigo-600 bg-indigo-50' },
    { to: '/admin/reports', icon: <Flag size={20} />, label: 'Reports', key: 'pendingReports', color: 'text-red-600 bg-red-50' },
    { to: '/admin/users', icon: <Users size={20} />, label: 'Users', key: 'users', color: 'text-green-600 bg-green-50' },
    { to: '/admin/lost-found', icon: <Search size={20} />, label: 'Lost & Found', key: 'lostFoundItems', color: 'text-amber-600 bg-amber-50' },
    { to: '/admin/logs', icon: <FileText size={20} />, label: 'Activity Logs', color: 'text-gray-600 bg-gray-50' },
];

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAPI.getStats()
            .then(({ data }) => setStats(data.stats))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <BarChart2 size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Admin Panel</h1>
                        <p className="text-gray-500 text-sm">Manage CampusOLX</p>
                    </div>
                </div>

                {/* Stats */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="card p-5 skeleton h-20" />)}
                    </div>
                ) : stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                        {[
                            { label: 'Total Users', value: stats.users, icon: <Users size={20} className="text-green-600" />, bg: 'bg-green-50' },
                            { label: 'Pending Verifications', value: stats.pendingVerifications, icon: <Shield size={20} className="text-indigo-600" />, bg: 'bg-indigo-50' },
                            { label: 'Pending Reports', value: stats.pendingReports, icon: <Flag size={20} className="text-red-600" />, bg: 'bg-red-50' },
                            { label: 'Total Listings', value: stats.listings, icon: <Package size={20} className="text-amber-600" />, bg: 'bg-amber-50' },
                        ].map((s, i) => (
                            <div key={i} className="card p-5">
                                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>{s.icon}</div>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Alerts */}
                {stats?.pendingVerifications > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 flex items-center justify-between">
                        <p className="text-indigo-700 font-medium text-sm">
                            🔔 {stats.pendingVerifications} verification{stats.pendingVerifications > 1 ? 's' : ''} waiting for review
                        </p>
                        <Link to="/admin/verifications" className="text-indigo-600 font-semibold text-sm hover:underline">Review →</Link>
                    </div>
                )}
                {stats?.pendingReports > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
                        <p className="text-red-700 font-medium text-sm">
                            🚨 {stats.pendingReports} report{stats.pendingReports > 1 ? 's' : ''} pending moderation
                        </p>
                        <Link to="/admin/reports" className="text-red-600 font-semibold text-sm hover:underline">Moderate →</Link>
                    </div>
                )}

                {/* Admin Links */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ADMIN_LINKS.map((link, i) => (
                        <Link key={i} to={link.to} className="card p-6 hover:-translate-y-1 transition-transform duration-200 group">
                            <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center mb-4`}>
                                {link.icon}
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1">{link.label}</h3>
                            {stats && link.key && (
                                <p className="text-sm text-gray-500">{stats[link.key]} {link.key === 'users' ? 'registered' : 'pending'}</p>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
