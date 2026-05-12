import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../api';
import { Upload, X, Plus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Cycles', 'Stationery', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Used'];

const CreateListing = () => {
    const { isVerifiedSeller } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [form, setForm] = useState({
        title: '', description: '', category: '', price: '',
        mrp: '', condition: '', availableFrom: ''
    });

    if (!isVerifiedSeller) {
        return (
            <div className="pt-24 text-center min-h-screen bg-gray-50 px-4">
                <div className="card max-w-md mx-auto p-10">
                    <Tag size={40} className="text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Verified Sellers Only</h2>
                    <p className="text-gray-500 text-sm mb-6">You need to be a verified seller to create listings.</p>
                    <button onClick={() => navigate('/become-seller')} className="btn-primary">
                        Get Verified →
                    </button>
                </div>
            </div>
        );
    }

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleImages = (files) => {
        const newFiles = Array.from(files).slice(0, 5 - images.length);
        const previews = newFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }));
        setImages(prev => [...prev, ...previews].slice(0, 5));
    };

    const removeImage = (i) => {
        URL.revokeObjectURL(images[i].url);
        setImages(prev => prev.filter((_, idx) => idx !== i));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files) handleImages(e.dataTransfer.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.category || !form.price || !form.condition) {
            return toast.error('Please fill all required fields');
        }

        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
            images.forEach(img => fd.append('images', img.file));

            await productsAPI.create(fd);
            toast.success('Listing created successfully! 🎉');
            navigate('/my-listings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    const isValid = form.title && form.description && form.category && form.price && form.condition;

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-black text-gray-900 mb-1">Create New Listing</h1>
                <p className="text-gray-500 text-sm mb-8">Fill in the details to list your item for sale</p>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Image Upload */}
                    <div className="card p-6">
                        <label className="label text-base mb-3 block">Product Photos (up to 5)</label>
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => e.preventDefault()}
                            onClick={() => images.length < 5 && fileRef.current.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${images.length < 5
                                    ? 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                                    : 'border-gray-200 cursor-default'
                                }`}
                        >
                            <Upload size={28} className="text-indigo-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 font-medium">
                                {images.length < 5 ? 'Drag & drop or click to upload' : 'Maximum 5 photos reached'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP up to 5MB each</p>
                            <input
                                type="file"
                                ref={fileRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={e => handleImages(e.target.files)}
                            />
                        </div>

                        {images.length > 0 && (
                            <div className="flex gap-3 mt-4 flex-wrap">
                                {images.map((img, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                        <img src={img.url} className="w-full h-full object-cover" />
                                        {i === 0 && (
                                            <div className="absolute bottom-0 left-0 right-0 bg-indigo-600 text-white text-[9px] font-bold text-center py-0.5">MAIN</div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                {images.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => fileRef.current.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-indigo-300 text-gray-400 hover:text-indigo-400 transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="card p-6 space-y-4">
                        <h2 className="font-bold text-gray-900">Basic Information</h2>

                        <div>
                            <label className="label">Title *</label>
                            <input name="title" value={form.title} onChange={handleChange} className="input" placeholder="e.g. Engineering Drawing textbook" maxLength={100} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Category *</label>
                                <select name="category" value={form.category} onChange={handleChange} className="input">
                                    <option value="">Select Category</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Condition *</label>
                                <select name="condition" value={form.condition} onChange={handleChange} className="input">
                                    <option value="">Select Condition</option>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Description *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none h-28" placeholder="Describe the item's condition, features, reason for selling..." maxLength={2000} />
                            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length}/2000</p>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="card p-6">
                        <h2 className="font-bold text-gray-900 mb-4">Pricing</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Selling Price (₹) *</label>
                                <input name="price" type="number" value={form.price} onChange={handleChange} className="input" placeholder="0" min="0" />
                            </div>
                            <div>
                                <label className="label">Original MRP (₹) <span className="text-gray-400 font-normal">optional</span></label>
                                <input name="mrp" type="number" value={form.mrp} onChange={handleChange} className="input" placeholder="0" min="0" />
                            </div>
                        </div>
                        {form.price && form.mrp && Number(form.mrp) > Number(form.price) && (
                            <p className="text-green-600 text-sm mt-2 font-medium">
                                Buyers save {Math.round((1 - form.price / form.mrp) * 100)}% off MRP!
                            </p>
                        )}
                    </div>

                    {/* Availability */}
                    <div className="card p-6">
                        <h2 className="font-bold text-gray-900 mb-1">Availability</h2>
                        <p className="text-gray-500 text-sm mb-4">Leaving campus later? Set a future availability date.</p>
                        <div>
                            <label className="label">Available From (optional)</label>
                            <input name="availableFrom" type="date" value={form.availableFrom} onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="input" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isValid}
                        className="btn-primary w-full justify-center text-base py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Publishing...' : '🚀 Publish Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;
