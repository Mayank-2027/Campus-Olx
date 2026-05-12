import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Flag, Eye, CheckCircle, Trash2, UserX, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');
    const [banModal, setBanModal] = useState(null);
    const [banReason, setBanReason] = useState('');

    useEffect(() => { fetchReports(); }, [statusFilter]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getReports(statusFilter);
            setReports(data.reports);
        } catch { } finally { setLoading(false); }
    };

    const handleDismiss = async (id) => {
        try {
            await adminAPI.dismissReport(id);
            toast.success('Report dismissed');
            fetchReports();
        } catch { toast.error('Failed'); }
    };

    const handleRemove = async (id) => {
       
        try {
            await adminAPI.removeListing(id);
            toast.success('Listing removed');
            fetchReports();
        } catch { toast.error('Failed'); }
    };

    const handleBan = async () => {
        if (!banModal) return;
        try {
            await adminAPI.banUser(banModal._id, banReason);
            toast.success('User banned and all listings hidden');
            setBanModal(null);
            fetchReports();
        } catch { toast.error('Failed'); }
    };

    const statusColor = { pending: 'badge-yellow', resolved: 'badge-green', dismissed: 'badge-gray' };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 text-sm">Admin</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Flag size={20} className="text-red-600" /> Report Moderation
                    </h1>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                    {['pending', 'resolved', 'dismissed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${statusFilter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2].map(i => <div key={i} className="card p-5 skeleton h-20" />)}</div>
                ) : reports.length === 0 ? (
                    <div className="card p-16 text-center">
                        <Flag size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No {statusFilter} reports</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map(r => (
                            <div key={r._id} className="card p-5">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold text-gray-900 text-sm">{r.productId?.title}</p>
                                            <span className={`badge text-xs ${statusColor[r.status]}`}>{r.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Reported by <strong>{r.reporterId?.name}</strong> • {new Date(r.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                    {r.productId && (
                                        <a href={`/product/${r.productId._id}`} target="_blank"
                                            className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                            <Eye size={12} /> View
                                        </a>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Reason:</p>
                                    <p className="text-sm text-gray-600">{r.reason}</p>
                                    {r.details && <p className="text-xs text-gray-500 mt-1 italic">"{r.details}"</p>}
                                </div>

                                {r.status === 'pending' && (
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => handleDismiss(r._id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200">
                                            <CheckCircle size={13} /> Dismiss
                                        </button>
                                        <button onClick={() => handleRemove(r._id)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-medium hover:bg-orange-100">
                                            <Trash2 size={13} /> Remove Listing
                                        </button>
                                        <button onClick={() => setBanModal(r)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100">
                                            <UserX size={13} /> Ban Seller
                                        </button>
                                    </div>
                                )}
                                {r.reviewedBy && (
                                    <p className="text-xs text-gray-400 mt-2">Reviewed by {r.reviewedBy.name} on {new Date(r.reviewedAt).toLocaleDateString()}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Ban Modal */}
            {banModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-gray-900 mb-3">Ban User</h3>
                        <p className="text-sm text-gray-500 mb-4">This will ban the seller and hide all their listings.</p>
                        <label className="label">Ban Reason</label>
                        <input value={banReason} onChange={e => setBanReason(e.target.value)} className="input mb-4" placeholder="Reason for ban..." />
                        <div className="flex gap-3">
                            <button onClick={() => setBanModal(null)} className="btn-ghost flex-1 justify-center border border-gray-200">Cancel</button>
                            <button onClick={handleBan} className="btn-danger flex-1 justify-center">Confirm Ban</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
