import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const ACTION_COLORS = {
    APPROVE_VERIFICATION: 'text-green-600 bg-green-50',
    REJECT_VERIFICATION: 'text-red-600 bg-red-50',
    BAN_USER: 'text-red-700 bg-red-100',
    UNBAN_USER: 'text-green-700 bg-green-100',
    MAKE_ADMIN: 'text-indigo-700 bg-indigo-100',
    REMOVE_LISTING: 'text-orange-600 bg-orange-50',
    VERIFY_CLAIM: 'text-teal-600 bg-teal-50',
};

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    useEffect(() => { fetchLogs(); }, [page]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getLogs({ page });
            setLogs(data.logs);
            setPages(data.pages);
        } catch { } finally { setLoading(false); }
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 text-sm">Admin</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <FileText size={20} className="text-gray-600" /> Activity Logs
                    </h1>
                </div>

                {loading ? (
                    <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <div key={i} className="card p-4 skeleton h-14" />)}</div>
                ) : logs.length === 0 ? (
                    <div className="card p-16 text-center">
                        <FileText size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No activity logs yet</p>
                    </div>
                ) : (
                    <>
                        <div className="card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Admin</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Action</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Details</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {logs.map(log => (
                                        <tr key={log._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 text-xs">{log.adminId?.name}</p>
                                                <p className="text-gray-400 text-xs">{log.adminId?.email?.split('@')[0]}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`badge text-xs font-semibold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                                                    {formatAction(log.action)}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-0.5 capitalize">{log.targetType}</p>
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell">
                                                <p className="text-xs text-gray-500 line-clamp-2">{log.details || '—'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString('en-IN', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {pages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === p ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminLogs;
