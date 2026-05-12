import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api';
import { Camera, Upload, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const BecomeSeller = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const fileRef = useRef();
    const [photo, setPhoto] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    if (user?.verificationStatus === 'pending') {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 px-4">
                <div className="card p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                    <p className="text-gray-500 text-sm">Your ID is being reviewed. You'll get notified once approved by admin.</p>
                    <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">Back to Dashboard</button>
                </div>
            </div>
        );
    }

    if (user?.isVerifiedSeller) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50 px-4">
                <div className="card p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">You're Verified!</h2>
                    <p className="text-gray-500 text-sm">You are already a verified seller. Start listing your items.</p>
                    <button onClick={() => navigate('/create-listing')} className="btn-primary mt-6">Create Listing →</button>
                </div>
            </div>
        );
    }

    const handleFile = (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return toast.error('File too large (max 10MB)');
        setPhoto(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!photo) return toast.error('Please upload your ID card photo');
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('idPhoto', photo);
            await adminAPI.submitVerification(fd);
            toast.success('Verification submitted! Admin will review shortly.');
            await refreshUser();
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCamera = () => {
        fileRef.current.setAttribute('capture', 'camera');
        fileRef.current.click();
    };

    const handleGallery = () => {
        fileRef.current.removeAttribute('capture');
        fileRef.current.click();
    };

    return (
        <div className="min-h-screen pt-20 pb-12 bg-gray-50">
            <div className="max-w-md mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield size={32} className="text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Get Verified to Sell</h1>
                    <p className="text-gray-500 text-sm mt-2">Upload your college ID for verification</p>
                </div>

                <div className="card p-6 space-y-5">
                    {/* Privacy note */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700">
                        <p className="font-semibold mb-1 flex items-center gap-2">
                            <Shield size={14} /> Your Privacy is Protected
                        </p>
                        <p>Your ID photo will be permanently deleted immediately after admin review. We never store ID cards in our database.</p>
                    </div>

                    {/* Upload area */}
                    {!preview ? (
                        <div className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center">
                            <Upload size={32} className="text-indigo-300 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium mb-4">Upload your college ID card</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={handleCamera} className="btn-secondary text-sm py-2 px-4">
                                    <Camera size={16} /> Take Photo
                                </button>
                                <button onClick={handleGallery} className="btn-primary text-sm py-2 px-4">
                                    <Upload size={16} /> Upload from Gallery
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={preview} alt="ID Preview" className="w-full rounded-xl object-cover max-h-64" />
                            <button
                                onClick={() => { setPhoto(null); setPreview(null); }}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                            >
                                ✕
                            </button>
                            <div className="mt-3 flex gap-2">
                                <button onClick={handleGallery} className="btn-ghost text-sm border border-gray-200 flex-1 justify-center">
                                    Change Photo
                                </button>
                            </div>
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileRef}
                        className="hidden"
                        accept="image/*"
                        onChange={e => handleFile(e.target.files[0])}
                    />

                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                        <p className="font-semibold text-gray-700 mb-2">Requirements:</p>
                        <p>✓ Must show your name and enrollment number</p>
                        <p>✓ Photo must be clear and readable</p>
                        <p>✓ Must be your current academic year ID</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || !photo}
                        className="btn-primary w-full justify-center text-base py-3 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : '📤 Submit for Verification'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BecomeSeller;
