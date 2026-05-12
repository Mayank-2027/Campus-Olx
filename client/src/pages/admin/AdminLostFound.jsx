import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { PackageSearch, MapPin, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminLostFound = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchItems(); }, [statusFilter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await adminAPI.getLostFound(statusFilter);
            setItems(data.items);
        } catch { } finally { setLoading(false); }
    };

    const handleVerifyClaim = async (id) => {
        try {
            await adminAPI.verifyClaim(id);
            toast.success('Claim verified — item marked as returned');
            fetchItems();
        } catch { toast.error('Failed'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this item? This action cannot be undone.')) return;
        try {
            await adminAPI.deleteLostFound(id);
            toast.success('Item deleted');
            fetchItems();
        } catch { toast.error('Failed to delete'); }
    };

    const statusColor = { open: 'badge-green', claimed: 'badge-yellow', returned: 'badge-indigo' };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                    <Link to="/admin" className="text-gray-500 hover:text-indigo-600 text-sm">Admin</Link>
                    <span className="text-gray-300">/</span>
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <PackageSearch size={20} className="text-amber-600" /> Lost & Found Moderation
                    </h1>
                </div>

                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
                    {[{ v: '', l: 'All' }, { v: 'open', l: 'Open' }, { v: 'claimed', l: 'Claimed' }, { v: 'returned', l: 'Returned' }].map(({ v, l }) => (
                        <button key={v} onClick={() => setStatusFilter(v)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${statusFilter === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>
                            {l}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[1, 2].map(i => <div key={i} className="card p-5 skeleton h-32" />)}
                    </div>
                ) : items.length === 0 ? (
                    <div className="card p-16 text-center">
                        <PackageSearch size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No items</p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                        {items.map(item => (
                            <div key={item._id} className="card p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`badge text-xs ${item.type === 'lost' ? 'badge-red' : 'badge-green'}`}>
                                            {item.type === 'lost' ? '😢 Lost' : '🎉 Found'}
                                        </span>
                                        <span className={`badge text-xs ${statusColor[item.status]}`}>{item.status}</span>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 mb-1">{item.itemName}</p>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                                    <MapPin size={11} /> {item.location}
                                </p>
                                <p className="text-xs text-gray-400 mb-2">Reported by: {item.reporterId?.name}</p>
                                {item.claimedBy && (
                                    <p className="text-xs text-amber-600 mb-2">Claimed by: {item.claimedBy.name}</p>
                                )}
                                {item.status === 'claimed' && (
                                    <button onClick={() => handleVerifyClaim(item._id)}
                                        className="flex items-center gap-1.5 text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 font-medium">
                                        <CheckCircle size={13} /> Verify Claim & Mark Returned
                                    </button>
                                )}
                                <button onClick={() => handleDelete(item._id)}
                                    className="flex items-center gap-1.5 text-xs text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium mt-2">
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLostFound;
