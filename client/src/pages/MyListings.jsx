import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { ShoppingBag, Pencil, Trash2, CheckCircle, Package, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = ['available', 'sold', 'pending'];

const MyListings = () => {
    const [tab, setTab] = useState('available');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchListings(); }, [tab]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const { data } = await productsAPI.getMyListings(tab);
            setProducts(data.products);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        try {
            await productsAPI.delete(id);
            toast.success('Listing deleted');
            fetchListings();
        } catch { toast.error('Failed to delete'); }
    };

    const handleMarkSold = async (id) => {
        try {
            await productsAPI.markSold(id);
            toast.success('Marked as sold!');
            fetchListings();
        } catch { toast.error('Failed'); }
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-black text-gray-900">My Listings</h1>
                    <Link to="/create-listing" className="btn-primary text-sm">
                        <Plus size={16} /> New Listing
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="card p-4 skeleton h-20" />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="card p-16 text-center">
                        <ShoppingBag size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No {tab} listings</p>
                        {tab === 'available' && (
                            <Link to="/create-listing" className="btn-primary mt-4 inline-flex">
                                <Plus size={16} /> Create Listing
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {products.map(product => (
                            <div key={product._id} className="card p-4 flex items-center gap-4">
                                {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <Package size={24} className="text-gray-300" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">{product.title}</p>
                                    <p className="text-indigo-600 font-bold text-sm">₹{product.price.toLocaleString()}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                        <span>👁 {product.viewCount} views</span>
                                        <span>💬 {product.chatCount} chats</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {product.status === 'available' && (
                                        <button onClick={() => handleMarkSold(product._id)}
                                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all" title="Mark as sold">
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    <Link to={`/edit-listing/${product._id}`}
                                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all">
                                        <Pencil size={18} />
                                    </Link>
                                    <button onClick={() => handleDelete(product._id)}
                                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyListings;
