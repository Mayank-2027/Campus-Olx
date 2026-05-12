import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api';
import { User, Mail, Hash, Calendar, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

const YEARS = ['1st', '2nd', '3rd', '4th'];

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ name: user?.name || '', year: user?.year || '' });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await usersAPI.updateProfile(form);
            await refreshUser();
            toast.success('Profile updated!');
            setEditing(false);
        } catch {
            toast.error('Update failed');
        } finally { setSaving(false); }
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-lg mx-auto px-4 py-8">
                <h1 className="text-2xl font-black text-gray-900 mb-8">My Profile</h1>

                <div className="card p-8 text-center mb-6">
                    <img
                        src={user?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=4f46e5&color=fff&size=120`}
                        alt={user?.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 ring-4 ring-indigo-100 object-cover"
                    />
                    <h2 className="text-xl font-black text-gray-900">{user?.name}</h2>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        {user?.isVerifiedSeller && <span className="badge-green">✓ Verified Seller</span>}
                        {user?.isAdmin && <span className="badge-indigo">Admin</span>}
                    </div>
                </div>

                <div className="card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Profile Details</h3>
                        {!editing ? (
                            <button onClick={() => setEditing(true)} className="text-sm text-indigo-600 font-medium hover:underline">Edit</button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setEditing(false)} className="text-sm text-gray-500">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="text-sm text-indigo-600 font-medium disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <User size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Full Name</p>
                            {editing ? (
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    className="input py-1 text-sm mt-0.5"
                                />
                            ) : (
                                <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                            )}
                        </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Mail size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900 text-sm">{user?.email}</p>
                        </div>
                    </div>

                    {/* Enrollment */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Hash size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Enrollment Number</p>
                            <p className="font-semibold text-gray-900 text-sm font-mono">{user?.enrollmentNo}</p>
                        </div>
                    </div>

                    {/* Branch */}
                    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Bookmark size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Branch</p>
                            <p className="font-semibold text-gray-900 text-sm">{user?.branchFull} ({user?.branch})</p>
                        </div>
                    </div>

                    {/* Year */}
                    <div className="flex items-center gap-3 py-3">
                        <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <Calendar size={16} className="text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">Current Year</p>
                            {editing ? (
                                <div className="flex gap-2 mt-1">
                                    {YEARS.map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, year: y }))}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-all ${form.year === y ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="font-semibold text-gray-900 text-sm">{user?.year} Year</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 card p-5">
                    <p className="text-xs text-gray-500">
                        Member since {new Date(user?.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Profile;
