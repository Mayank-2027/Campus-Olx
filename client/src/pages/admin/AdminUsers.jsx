import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Users, Search, Ban, CheckCircle, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [banModal, setBanModal] = useState(null);
    const [banReason, setBanReason] = useState('');

    useEffect(() => {
        const t = setTimeout(() => fetchUsers(), 400);
        return () => clearTimeout(t);
    }, [search, filter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getUsers({ search, filter });
            setUsers(data.users);
        } catch { } finally { setLoading(false); }
    };

    const handleBan = async () => {
        try {
            await adminAPI.banUserById(banModal._id, banReason);
            toast.success('User banned');
            setBanModal(null);
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const handleUnban = async (id) => {
        try {
            await adminAPI.unbanUser(id);
            toast.success('User unbanned');
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const handleMakeAdmin = async (id) => {
        if (!confirm('Make this user an admin?')) return;
        try {
            await adminAPI.makeAdmin(id);
            toast.success('User is now an admin');
            fetchUsers();
        } catch { toast.error('Failed'); }
    };

    const FILTERS = [
        { value: '', label: 'All Users' },
        { value: 'verified', label: 'Verified Sellers' },
        { value: 'unverified', label: 'Unverified' },
        { value: 'banned', label: 'Banned' },
        { value: 'admin', label: 'Admins' },
    ];

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 text-sm">Admin</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Users size={20} className="text-green-600" /> User Management
                    </h1>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, or enrollment..."
                            className="input pl-9"
                        />
                    </div>
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="input sm:w-48">
                        {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 skeleton h-16" />)}</div>
                ) : users.length === 0 ? (
                    <div className="card p-16 text-center">
                        <Users size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No users found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {users.map(u => (
                            <div key={u._id} className="card p-4 flex items-center gap-4">
                                <img
                                    src={u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=4f46e5&color=fff&size=50`}
                                    alt={u.name}
                                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-gray-900 text-sm">{u.name}</p>
                                        {u.isVerifiedSeller && <span className="badge-green text-xs">Verified</span>}
                                        {u.isAdmin && <span className="badge-indigo text-xs">Admin</span>}
                                        {u.isBanned && <span className="badge-red text-xs">Banned</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                    <p className="text-xs text-gray-400">{u.enrollmentNo} • {u.year} Year • {u.branchFull}</p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                                    {!u.isAdmin && (
                                        <button onClick={() => handleMakeAdmin(u._id)}
                                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition-all" title="Make Admin">
                                            <Shield size={16} />
                                        </button>
                                    )}
                                    {u.isBanned ? (
                                        <button onClick={() => handleUnban(u._id)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100">
                                            <CheckCircle size={13} /> Unban
                                        </button>
                                    ) : (
                                        !u.isAdmin && (
                                            <button onClick={() => setBanModal(u)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100">
                                                <Ban size={13} /> Ban
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {banModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-gray-900 mb-2">Ban User</h3>
                        <p className="text-sm text-gray-500 mb-4">Banning: <strong>{banModal.name}</strong></p>
                        <label className="label">Reason</label>
                        <input value={banReason} onChange={e => setBanReason(e.target.value)} className="input mb-4" placeholder="Reason..." />
                        <div className="flex gap-3">
                            <button onClick={() => setBanModal(null)} className="btn-ghost flex-1 justify-center border border-gray-200">Cancel</button>
                            <button onClick={handleBan} className="btn-danger flex-1 justify-center">Ban User</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
