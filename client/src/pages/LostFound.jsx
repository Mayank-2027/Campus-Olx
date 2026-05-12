import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { lostFoundAPI } from '../api';
import { AlertCircle, PackageSearch, MapPin, Calendar, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LostFound = () => {
    const { isAuthenticated } = useAuth();
    const [tab, setTab] = useState('lost');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        lostFoundAPI.getAll({ type: tab })
            .then(({ data }) => setItems(data.items))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [tab]);

    const refresh = () => {
        setLoading(true);
        lostFoundAPI.getAll({ type: tab })
            .then(({ data }) => setItems(data.items))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report?')) return;
        try {
            await lostFoundAPI.deleteItem(id);
            toast.success('Deleted');
            refresh();
        } catch {
            toast.error('Delete failed');
        }
    };

    const statusColor = {
        open: 'badge-green',
        claimed: 'badge-yellow',
        returned: 'badge-indigo'
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Lost & Found</h1>
                        <p className="text-gray-500 text-sm">Report or find lost items on campus</p>
                    </div>
                    {isAuthenticated && (
                        <div className="flex gap-2">
                            <Link to="/lost-found/report-lost" className="btn-secondary text-sm py-2 px-4">
                                <Plus size={14} /> Report Lost
                            </Link>
                            <Link to="/lost-found/report-found" className="btn-primary text-sm py-2 px-4">
                                <Plus size={14} /> Report Found
                            </Link>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                    {['lost', 'found'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-6 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                                }`}
                        >
                            {t === 'lost' ? '😢 Lost Items' : '🎉 Found Items'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="card p-4">
                                <div className="skeleton h-4 w-3/4 rounded mb-2" />
                                <div className="skeleton h-3 w-full rounded mb-2" />
                                <div className="skeleton h-3 w-1/2 rounded" />
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="card p-16 text-center">
                        <PackageSearch size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No {tab} items reported yet</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {items.map(item => (
                            <div key={item._id} className="card p-5">
                                {item.images?.[0] && (
                                    <img src={item.images[0]} alt={item.itemName} className="w-full h-32 object-cover rounded-xl mb-4" />
                                )}
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-bold text-gray-900">{item.itemName}</h3>
                                    <span className={`badge text-xs flex-shrink-0 ${statusColor[item.status]}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                                <div className="space-y-1.5 text-xs text-gray-500">
                                    <p className="flex items-center gap-1.5">
                                        <MapPin size={12} className="text-indigo-400" /> {item.location}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <Calendar size={12} className="text-indigo-400" />
                                        {new Date(item.date).toLocaleDateString('en-IN')}
                                    </p>
                                    <p className="flex items-center gap-1.5">
                                        <AlertCircle size={12} className="text-indigo-400" />
                                        Reported by {item.reporterId?.name}
                                    </p>
                                    {item.handedOverTo && (
                                        <p className="text-green-600 font-medium">📦 Handed to: {item.handedOverTo}</p>
                                    )}
                                </div>
                                {isAuthenticated && user && (user.isAdmin || user._id === item.reporterId?._id) && (
                                    <button onClick={() => handleDelete(item._id)}
                                        className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LostFound;
