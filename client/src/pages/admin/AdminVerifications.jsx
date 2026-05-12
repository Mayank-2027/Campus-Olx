import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { CheckCircle, XCircle, Eye, Clock, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const REJECT_REASONS = ['Photo not clear', 'Wrong ID', 'Not a student', 'Expired ID', 'Other'];

const AdminVerifications = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [photoModal, setPhotoModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('Photo not clear');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchVerifications(); }, []);

    const fetchVerifications = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getVerifications();
            setVerifications(data.verifications);
        } catch { } finally { setLoading(false); }
    };

    const handleApprove = async (id) => {
        setActionLoading(true);
        try {
            await adminAPI.approveVerification(id);
            toast.success('✅ Verification approved! ID photo permanently deleted.');
            fetchVerifications();
            setPhotoModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setActionLoading(false); }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setActionLoading(true);
        try {
            await adminAPI.rejectVerification(rejectModal._id, rejectReason);
            toast.success('Verification rejected. ID photo permanently deleted.');
            fetchVerifications();
            setRejectModal(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        } finally { setActionLoading(false); }
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 text-sm">Admin</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Shield size={20} className="text-indigo-600" /> Seller Verifications
                    </h1>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="card p-5 skeleton h-24" />)}
                    </div>
                ) : verifications.length === 0 ? (
                    <div className="card p-16 text-center">
                        <CheckCircle size={36} className="text-green-300 mx-auto mb-3" />
                        <p className="text-gray-500">No pending verifications 🎉</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-500">{verifications.length} pending verification{verifications.length > 1 ? 's' : ''}</p>
                        {verifications.map(v => (
                            <div key={v._id} className="card p-5">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={v.userId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(v.userId?.name || 'U')}&background=4f46e5&color=fff&size=60`}
                                        alt={v.userId?.name}
                                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900">{v.userId?.name}</p>
                                        <p className="text-sm text-gray-500">{v.userId?.email}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                            <span>{v.userId?.enrollmentNo}</span>
                                            <span>•</span>
                                            <span>{v.userId?.year} Year</span>
                                            <span>•</span>
                                            <span>{v.userId?.branchFull}</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                            <Clock size={11} />
                                            <span>Submitted {new Date(v.submittedAt).toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                        <button
                                            onClick={() => setPhotoModal(v)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors"
                                        >
                                            <Eye size={15} /> View ID
                                        </button>
                                        <button
                                            onClick={() => handleApprove(v._id)}
                                            disabled={actionLoading}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            <CheckCircle size={15} /> Approve
                                        </button>
                                        <button
                                            onClick={() => setRejectModal(v)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                                        >
                                            <XCircle size={15} /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Photo Modal */}
            {photoModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">ID Card — {photoModal.userId?.name}</h3>
                            <button onClick={() => setPhotoModal(null)}><X size={20} className="text-gray-400" /></button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-2 mb-4">
                            <img
                                src={adminAPI.getVerificationPhoto(photoModal._id)}
                                alt="ID Card"
                                className="w-full rounded-lg object-contain max-h-80"
                                onError={e => { e.target.alt = 'Photo not available or already deleted'; }}
                            />
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 mb-4">
                            ⚠️ This photo will be permanently deleted once you click Approve or Reject
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleApprove(photoModal._id)}
                                disabled={actionLoading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <CheckCircle size={16} /> Approve
                            </button>
                            <button
                                onClick={() => { setPhotoModal(null); setRejectModal(photoModal); }}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <XCircle size={16} /> Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Reject Verification</h3>
                        <p className="text-sm text-gray-600 mb-4">Rejecting: <strong>{rejectModal.userId?.name}</strong></p>
                        <label className="label">Rejection Reason</label>
                        <select
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            className="input mb-4"
                        >
                            {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setRejectModal(null)} className="btn-ghost flex-1 justify-center border border-gray-200">Cancel</button>
                            <button onClick={handleReject} disabled={actionLoading} className="btn-danger flex-1 justify-center disabled:opacity-50">
                                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerifications;
