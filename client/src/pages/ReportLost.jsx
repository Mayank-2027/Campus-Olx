import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { lostFoundAPI } from '../api';
import { Upload, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ReportLost = () => {
    const navigate = useNavigate();
    const fileRef = useRef();
    const [loading, setLoading] = useState(false);
    const [images, setImages] = useState([]);
    const [form, setForm] = useState({ itemName: '', description: '', location: '', date: '', contactInfo: '' });

    const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleImages = (files) => {
        const newFiles = Array.from(files).slice(0, 3 - images.length);
        const previews = newFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }));
        setImages(prev => [...prev, ...previews].slice(0, 3));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.itemName || !form.description || !form.location || !form.date) {
            return toast.error('Please fill all required fields');
        }
        setLoading(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
            images.forEach(img => fd.append('images', img.file));
            await lostFoundAPI.reportLost(fd);
            toast.success('Lost item reported!');
            navigate('/lost-found');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-lg mx-auto px-4 py-8">
                <Link to="/lost-found" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 text-sm font-medium">
                    <ChevronLeft size={16} /> Back
                </Link>
                <h1 className="text-2xl font-black text-gray-900 mb-6">😢 Report Lost Item</h1>
                <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                    <div>
                        <label className="label">Item Name *</label>
                        <input name="itemName" value={form.itemName} onChange={handleChange} className="input" placeholder="e.g. Blue water bottle" />
                    </div>
                    <div>
                        <label className="label">Description *</label>
                        <textarea name="description" value={form.description} onChange={handleChange} className="input resize-none h-24" placeholder="Describe the item in detail..." />
                    </div>
                    <div>
                        <label className="label">Where did you lose it? *</label>
                        <input name="location" value={form.location} onChange={handleChange} className="input" placeholder="e.g. Library, Room 204" />
                    </div>
                    <div>
                        <label className="label">Date Lost *</label>
                        <input name="date" type="date" value={form.date} onChange={handleChange} max={new Date().toISOString().split('T')[0]} className="input" />
                    </div>
                    <div>
                        <label className="label">Contact (optional)</label>
                        <input name="contactInfo" value={form.contactInfo} onChange={handleChange} className="input" placeholder="Phone or room number" />
                    </div>
                    <div>
                        <label className="label">Photos (optional)</label>
                        <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-300">
                            <Upload size={20} className="text-gray-400 mx-auto mb-1" />
                            <p className="text-sm text-gray-500">Click to upload up to 3 photos</p>
                        </div>
                        <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={e => handleImages(e.target.files)} />
                        {images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                                {images.map((img, i) => (
                                    <img key={i} src={img.url} className="w-16 h-16 object-cover rounded-lg" />
                                ))}
                            </div>
                        )}
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Report Lost Item'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportLost;
