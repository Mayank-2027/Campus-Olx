import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api';
import { CheckCircle, AlertCircle, User, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const YEARS = ['1st', '2nd', '3rd', '4th'];

const CompleteProfile = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: user?.name || '',
        enrollmentNo: '',
        year: ''
    });
    const [enrollmentData, setEnrollmentData] = useState(null);
    const [enrollmentError, setEnrollmentError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        if (user?.isProfileComplete) navigate('/dashboard');
    }, [user]);

    const validateEnrollment = async (value) => {
        if (!value || value.length < 8) {
            setEnrollmentData(null);
            setEnrollmentError('');
            return;
        }
        setValidating(true);
        try {
            const { data } = await usersAPI.validateEnrollment(value);
            if (data.valid) {
                setEnrollmentData(data);
                setEnrollmentError('');
            } else {
                setEnrollmentData(null);
                setEnrollmentError(data.message);
            }
        } catch {
            setEnrollmentError('Validation failed');
        } finally {
            setValidating(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === 'enrollmentNo') {
            validateEnrollment(value.toUpperCase());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.enrollmentNo || !form.year) {
            return toast.error('Please fill all fields');
        }
        if (!enrollmentData) {
            return toast.error('Please enter a valid enrollment number');
        }
        setLoading(true);
        try {
            await usersAPI.completeProfile(form);
            toast.success('Profile completed! Welcome to CampusOLX 🎉');
            await refreshUser();
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white pt-16 px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <img
                        src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff&size=100`}
                        alt={user?.name}
                        className="w-20 h-20 rounded-full mx-auto mb-4 ring-4 ring-indigo-200 object-cover"
                    />
                    <h1 className="text-2xl font-black text-gray-900">Complete Your Profile</h1>
                    <p className="text-gray-500 text-sm mt-1">Just a few more details to get you started</p>
                </div>

                <div className="card p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="label">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Email (disabled) */}
                        <div>
                            <label className="label">Email Address</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="input bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Verified via Google — cannot be changed</p>
                        </div>

                        {/* Enrollment */}
                        <div>
                            <label className="label">Enrollment Number</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="enrollmentNo"
                                    value={form.enrollmentNo}
                                    onChange={handleChange}
                                    className={`input uppercase pr-10 ${enrollmentData ? 'border-green-400 focus:ring-green-400' :
                                            enrollmentError ? 'border-red-400 focus:ring-red-400' : ''
                                        }`}
                                    placeholder="e.g. 0201IT231062"
                                    maxLength={20}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {validating && <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />}
                                    {!validating && enrollmentData && <CheckCircle size={18} className="text-green-500" />}
                                    {!validating && enrollmentError && <AlertCircle size={18} className="text-red-500" />}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Format: 0201[BRANCH][YEAR][ROLL] — e.g. 0201IT231062</p>
                            {enrollmentError && <p className="text-xs text-red-500 mt-1">{enrollmentError}</p>}
                        </div>

                        {/* Auto-detected info */}
                        {enrollmentData && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                                    <CheckCircle size={14} /> Auto-detected from enrollment
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Branch:</span>
                                        <span className="ml-2 font-semibold text-gray-800">{enrollmentData.branchFull}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Joining Year:</span>
                                        <span className="ml-2 font-semibold text-gray-800">{enrollmentData.joiningYear}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Year */}
                        <div>
                            <label className="label">Current Year</label>
                            <div className="grid grid-cols-4 gap-2">
                                {YEARS.map(y => (
                                    <label
                                        key={y}
                                        className={`flex items-center justify-center py-2.5 rounded-lg border-2 cursor-pointer text-sm font-semibold transition-all ${form.year === y
                                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                                : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="year"
                                            value={y}
                                            checked={form.year === y}
                                            onChange={handleChange}
                                            className="hidden"
                                        />
                                        {y}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !enrollmentData}
                            className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save & Continue →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
