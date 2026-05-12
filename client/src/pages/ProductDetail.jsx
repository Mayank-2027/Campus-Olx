import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI, chatsAPI, reportsAPI } from '../api';
import {
    ChevronLeft, ChevronRight, MessageCircle, Flag, Share2,
    CheckCircle, Clock, Package, User, Calendar, Eye, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
    'Fake item (doesn\'t exist)',
    'Wrong price (misleading)',
    'Scam/fraud attempt',
    'Offensive content',
    'Duplicate listing',
    'Other'
];

const ProductDetail = () => {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imgIndex, setImgIndex] = useState(0);
    const [reportModal, setReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ reason: '', details: '' });
    const [chatLoading, setChatLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data } = await productsAPI.getOne(id);
            setProduct(data.product);
        } catch {
            toast.error('Product not found');
            navigate('/marketplace');
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!isAuthenticated) return navigate('/login');
        setChatLoading(true);
        try {
            const { data } = await chatsAPI.startChat(product.sellerId._id, product._id);
            navigate(`/chat/${data.chat._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not start chat');
        } finally {
            setChatLoading(false);
        }
    };

    const handleReport = async (e) => {
        e.preventDefault();
        if (!reportForm.reason) return toast.error('Please select a reason');
        setReportLoading(true);
        try {
            await reportsAPI.submit({ productId: id, ...reportForm });
            toast.success('Report submitted. Admin will review it.');
            setReportModal(false);
            setReportForm({ reason: '', details: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit report');
        } finally {
            setReportLoading(false);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date);
        const days = Math.floor(diff / 86400000);
        if (days < 1) return 'Today';
        if (days < 30) return `${days} days ago`;
        return new Date(date).toLocaleDateString('en-IN');
    };

    if (loading) {
        return (
            <div className="pt-20 min-h-screen bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
                    <div className="skeleton h-96 rounded-2xl" />
                    <div className="space-y-4">
                        <div className="skeleton h-8 w-3/4 rounded" />
                        <div className="skeleton h-10 w-1/3 rounded" />
                        <div className="skeleton h-4 w-full rounded" />
                        <div className="skeleton h-4 w-full rounded" />
                        <div className="skeleton h-4 w-2/3 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const isSeller = user?._id === product.sellerId?._id;
    const images = product.images?.length > 0 ? product.images : [null];

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* Back */}
                <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 text-sm font-medium">
                    <ChevronLeft size={16} /> Back to Marketplace
                </Link>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Image Gallery */}
                    <div>
                        <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
                            {images[imgIndex] ? (
                                <img src={images[imgIndex]} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Package size={48} className="text-gray-300" />
                                </div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-all"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setImgIndex(i => (i + 1) % images.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-all"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </>
                            )}

                            {product.status === 'sold' && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="bg-red-500 text-white font-black text-2xl px-6 py-3 rounded-2xl rotate-[-15deg]">SOLD</span>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 mt-3">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImgIndex(i)}
                                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === imgIndex ? 'border-indigo-600' : 'border-transparent'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`badge text-xs ${product.condition === 'New' ? 'badge-green' :
                                            product.condition === 'Like New' ? 'badge-indigo' : 'badge-gray'
                                        }`}>{product.condition}</span>
                                    <span className="badge-gray text-xs">{product.category}</span>
                                </div>
                                <h1 className="text-2xl font-black text-gray-900">{product.title}</h1>
                            </div>
                            <button onClick={handleShare} className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 flex-shrink-0">
                                <Share2 size={18} />
                            </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-center gap-3">
                            <span className="text-4xl font-black text-indigo-600">₹{product.price.toLocaleString()}</span>
                            {product.mrp && (
                                <div className="text-right">
                                    <p className="text-gray-400 line-through text-sm">₹{product.mrp.toLocaleString()}</p>
                                    <p className="text-green-600 text-xs font-bold">
                                        {Math.round((1 - product.price / product.mrp) * 100)}% off
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Eye size={14} /> {product.viewCount} views</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> {timeAgo(product.createdAt)}</span>
                            {product.availableFrom && new Date(product.availableFrom) > new Date() && (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <Clock size={14} /> Available from {new Date(product.availableFrom).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Description</p>
                            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
                        </div>

                        {/* Seller info */}
                        <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl">
                            <img
                                src={product.sellerId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.sellerId?.name || 'S')}&background=4f46e5&color=fff&size=60`}
                                alt={product.sellerId?.name}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-gray-900 text-sm">{product.sellerId?.name}</p>
                                    {product.sellerId?.isVerifiedSeller && (
                                        <CheckCircle size={14} className="text-green-500" />
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">{product.sellerId?.year} Year • {product.sellerId?.branchFull}</p>
                            </div>
                            <User size={16} className="text-gray-400" />
                        </div>

                        {/* Actions */}
                        {!isSeller && (
                            <div className="flex gap-3">
                                {product.status === 'available' ? (
                                    <button
                                        onClick={handleChat}
                                        disabled={chatLoading}
                                        className="btn-primary flex-1 justify-center text-base py-3 disabled:opacity-50"
                                    >
                                        {chatLoading ? '...' : <><MessageCircle size={18} /> Chat with Seller</>}
                                    </button>
                                ) : (
                                    <div className="flex-1 bg-gray-100 text-gray-500 font-semibold py-3 px-6 rounded-full text-center">
                                        Item Already Sold
                                    </div>
                                )}
                                {isAuthenticated && (
                                    <button
                                        onClick={() => setReportModal(true)}
                                        className="p-3 border-2 border-gray-200 rounded-full text-gray-400 hover:border-red-300 hover:text-red-500 transition-all"
                                        title="Report this listing"
                                    >
                                        <Flag size={18} />
                                    </button>
                                )}
                            </div>
                        )}

                        {isSeller && (
                            <div className="flex gap-3">
                                <Link to={`/edit-listing/${id}`} className="btn-secondary flex-1 justify-center">
                                    Edit Listing
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Report Modal */}
            {reportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-gray-900">Report This Listing</h3>
                            <button onClick={() => setReportModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleReport} className="space-y-4">
                            <div>
                                <label className="label">Reason *</label>
                                <select
                                    value={reportForm.reason}
                                    onChange={e => setReportForm(f => ({ ...f, reason: e.target.value }))}
                                    className="input"
                                    required
                                >
                                    <option value="">Select a reason</option>
                                    {REPORT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Additional Details (optional)</label>
                                <textarea
                                    value={reportForm.details}
                                    onChange={e => setReportForm(f => ({ ...f, details: e.target.value }))}
                                    className="input resize-none h-24"
                                    placeholder="Describe the issue..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setReportModal(false)} className="btn-ghost flex-1 justify-center border border-gray-200">
                                    Cancel
                                </button>
                                <button type="submit" disabled={reportLoading} className="btn-danger flex-1 justify-center disabled:opacity-50">
                                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
