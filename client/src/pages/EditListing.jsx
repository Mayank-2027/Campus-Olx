import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Cycles', 'Stationery', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Used'];
const STATUSES = ['available', 'sold', 'pending'];

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', category: '', price: '',
        mrp: '', condition: '', status: 'available', availableFrom: ''
    });

    useEffect(() => {
        productsAPI.getOne(id).then(({ data }) => {
            const p = data.product;
            setForm({
                title: p.title || '',
                description: p.description || '',
                category: p.category || '',
                price: p.price || '',
                mrp: p.mrp || '',
                condition: p.condition || '',
                status: p.status || 'available',
                availableFrom: p.availableFrom ? new Date(p.availableFrom).toISOString().split('T')[0] : ''
            });
        }).catch(() => navigate('/my-listings'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await productsAPI.update(id, form);
            toast.success('Listing updated!');
            navigate('/my-listings');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="pt-24 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /></div>;

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Link to="/my-listings" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 text-sm font-medium">
                    <ChevronLeft size={16} /> Back to Listings
                </Link>
                <h1 className="text-2xl font-black text-gray-900 mb-8">Edit Listing</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="card p-6 space-y-4">
                        <div>
                            <label className="label">Title *</label>
                            <input name="title" value={form.title} onChange={handleChange} className="input" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Category *</label>
                                <select name="category" value={form.category} onChange={handleChange} className="input">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Condition *</label>
                                <select name="condition" value={form.condition} onChange={handleChange} className="input">
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Description *</label>
                            <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none h-28" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Price (₹) *</label>
                                <input name="price" type="number" value={form.price} onChange={handleChange} className="input" />
                            </div>
                            <div>
                                <label className="label">MRP (₹)</label>
                                <input name="mrp" type="number" value={form.mrp} onChange={handleChange} className="input" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Status</label>
                                <select name="status" value={form.status} onChange={handleChange} className="input">
                                    {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label">Available From</label>
                                <input name="availableFrom" type="date" value={form.availableFrom} onChange={handleChange} className="input" />
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={saving} className="btn-primary w-full justify-center text-base py-3 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditListing;
