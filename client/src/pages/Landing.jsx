import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShoppingBag, Shield, Heart, Leaf, ArrowRight, ChevronDown,
    BookOpen, Laptop, Armchair, Bike, Pencil, Gamepad2,
    Users, Package, Handshake, Tag, Search, MessageCircle,
    MapPin, Star, CheckCircle, ChevronLeft, ChevronRight,
    Lock, Bell, Flag, UserCheck
} from 'lucide-react';

const CATEGORIES = [
    { name: 'Books', emoji: '📚', desc: 'Textbooks, novels, guides', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
    { name: 'Electronics', emoji: '💻', desc: 'Laptops, phones, accessories', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
    { name: 'Furniture', emoji: '🪑', desc: 'Chairs, tables, hostel essentials', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
    { name: 'Cycles', emoji: '🚲', desc: 'Bikes, accessories', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
    { name: 'Stationery', emoji: '✏️', desc: 'Notes, supplies', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
    { name: 'Others', emoji: '🎲', desc: 'Sports, clothing, misc', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
];

const FEATURES = [
    { icon: <Lock size={22} className="text-indigo-600" />, title: 'Google Authentication', desc: 'One-click access with secure authentication.' },
    { icon: <UserCheck size={22} className="text-green-600" />, title: 'Seller Verification', desc: 'ID card verification ensures only real students sell.' },
    { icon: <MessageCircle size={22} className="text-blue-600" />, title: 'Real-time Chat', desc: 'Talk directly with buyers/sellers instantly.' },
    { icon: <Search size={22} className="text-amber-600" />, title: 'Lost & Found', desc: 'Report and recover lost items on campus.' },
    { icon: <Flag size={22} className="text-red-500" />, title: 'Report System', desc: 'Flag inappropriate listings for review.' },
    { icon: <Shield size={22} className="text-purple-600" />, title: 'Admin Moderation', desc: 'Dedicated team keeps the platform safe 24/7.' },
];



const STEPS = [
    { step: '01', icon: <Lock size={24} />, title: 'Login with Google', desc: 'Use your email — instant login' },
    { step: '02', icon: <Search size={24} />, title: 'Browse or Post', desc: 'Find what you need or sell what you don\'t need' },
    { step: '03', icon: <MessageCircle size={24} />, title: 'Chat Securely', desc: 'Connect only with fellow students' },
    { step: '04', icon: <MapPin size={24} />, title: 'Meet on Campus', desc: 'Exchange safely within campus boundaries' },
];

const Landing = () => {
    const { loginWithGoogle, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState({});
    const intervalRef = useRef(null);

    // Auto-slide testimonials
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length);
        }, 4000);
        return () => clearInterval(intervalRef.current);
    }, []);

    const handleCTA = () => {
        if (isAuthenticated) navigate('/marketplace');
        else loginWithGoogle();
    };

    return (
        <div className="overflow-x-hidden">
            {/* ── HERO ────────────────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
                {/* Background blobs */}
                <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-40 -z-10" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-100 rounded-full blur-3xl opacity-30 -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <div className="space-y-8 animate-slide-up">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-full">
                                🎓 Exclusive to College Students
                            </div>

                            <h1 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                                Buy. Sell.{' '}
                                <span className="text-indigo-600 relative">
                                    Reuse.
                                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                        <path d="M2 10 Q150 2 298 10" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4" />
                                    </svg>
                                </span>
                            </h1>

                            <p className="text-xl text-gray-500 leading-relaxed max-w-lg">
                                The trusted marketplace built just for your campus community.
                                No strangers, just <span className="font-semibold text-gray-700">fellow students.</span>
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <button onClick={handleCTA} className="btn-primary text-base py-3 px-7 shadow-indigo-200">
                                    Start Browsing <ArrowRight size={18} />
                                </button>
                                <a href="#how-it-works" className="btn-secondary text-base py-3 px-7">
                                    Learn How It Works
                                </a>
                            </div>

                           
                        </div>

                        {/* Right - Illustration */}
                        <div className="relative hidden lg:block">
                            <div className="relative w-full h-96">
                                {/* Floating cards */}
                                <div className="absolute top-0 right-8 card p-4 w-52 animate-pulse-slow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-2xl">📚</div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Engineering Books</p>
                                            <p className="text-indigo-600 font-bold">₹350</p>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-1">
                                        <CheckCircle size={12} className="text-green-500" />
                                        <span className="text-xs text-green-600 font-medium">Verified Seller</span>
                                    </div>
                                </div>

                                <div className="absolute bottom-16 left-0 card p-4 w-48">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">💻</div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Dell Laptop</p>
                                            <p className="text-indigo-600 font-bold">₹18,000</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-4 right-4 card p-4 w-44">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">🚲</div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-800">Cycle</p>
                                            <p className="text-indigo-600 font-bold">₹2,500</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-300">
                                    <ShoppingBag size={52} className="text-white" />
                                </div>

                                {/* Chat bubble */}
                                <div className="absolute top-24 left-8 bg-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-2xl rounded-tl-sm shadow-lg">
                                    Hey! Is this still available? 👋
                                </div>

                                {/* Success badge */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                                    <CheckCircle size={12} /> Sold for ₹12,000 🎉
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <a href="#story" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-600 transition-colors">
                    <span className="text-xs font-medium">Scroll down</span>
                    <ChevronDown size={20} className="animate-bounce" />
                </a>
            </section>

            {/* ── STORY ───────────────────────────────────────────────────────── */}
            <section id="story" className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="section-title mb-4">The Story Behind CampusOLX</h2>
                    <p className="text-gray-500 mb-8">Why we built this</p>

                    <blockquote className="relative bg-indigo-50 rounded-2xl p-8 border-l-4 border-indigo-600 text-left mb-8">
                        <div className="text-4xl text-indigo-300 font-serif leading-none mb-3">"</div>
                        <p className="text-lg text-gray-700 leading-relaxed italic">
                            Every year, when seniors packed up and left, I'd walk through the hostels and see piles of useful things—books, lamps, cycles—just left behind or tossed away. Honestly, it hurt to watch so much go to waste.
                        </p>
                        <footer className="mt-4 text-indigo-600 font-semibold">— Founder</footer>
                    </blockquote>

                    <p className="text-gray-600 text-lg leading-relaxed mb-12">
                        CampusOLX was born to solve this. A platform where seniors can pass down their stuff to juniors, where no useful item goes to waste, and where every transaction happens within the trusted walls of our campus.
                    </p>

                    {/* Impact cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { icon: <Leaf size={28} className="text-green-600" />, title: 'Zero Waste', desc: 'Keeping usable items on campus and out of trash', bg: 'bg-green-50' },
                            { icon: <Shield size={28} className="text-indigo-600" />, title: 'Trust First', desc: 'Only verified students — no strangers allowed', bg: 'bg-indigo-50' },
                            { icon: <Heart size={28} className="text-pink-600" />, title: 'Free Forever', desc: 'Zero platform fees, ever. Community over profit.', bg: 'bg-pink-50' },
                        ].map((card, i) => (
                            <div key={i} className={`${card.bg} rounded-2xl p-6 text-center`}>
                                <div className="flex justify-center mb-3">{card.icon}</div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">{card.title}</h3>
                                <p className="text-gray-600 text-sm">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
            <section id="how-it-works" className="py-20 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Get started in minutes — no lengthy signup</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {STEPS.map((step, i) => (
                            <div key={i} className="relative">
                                <div className="card p-6 text-center h-full">
                                    <div className="text-xs font-black text-indigo-300 mb-4 text-5xl">{step.step}</div>
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                        {step.icon}
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm">{step.desc}</p>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="hidden lg:flex absolute top-1/2 -right-3 z-10">
                                        <ArrowRight size={20} className="text-indigo-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES GRID ───────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="section-title">Built for Campus Life</h2>
                        <p className="section-subtitle">Every feature designed with students in mind</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <div key={i} className="card p-6 group hover:-translate-y-1 transition-transform duration-300">
                                <div className="w-12 h-12 bg-gray-50 group-hover:bg-indigo-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* ── CATEGORIES ──────────────────────────────────────────────────── */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="section-title">What Students Buy & Sell</h2>
                        <p className="section-subtitle">Explore popular categories on campus</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {CATEGORIES.map((cat, i) => (
                            <Link
                                key={i}
                                to={`/marketplace/category/${cat.name}`}
                                className={`${cat.color} border rounded-2xl p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md group`}
                            >
                                <div className="text-4xl mb-2">{cat.emoji}</div>
                                <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-tight">{cat.desc}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS BANNER ────────────────────────────────────────────────── */}
            <section className="py-16 bg-indigo-600">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
                        {[
                            { value: '500+', label: 'Active Students' },
                            { value: '1000+', label: 'Items Listed' },
                            { value: '50+', label: 'Successful Trades' },
                            { value: '₹0', label: 'Fees Charged' },
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-4xl font-black mb-1">{stat.value}</div>
                                <div className="text-indigo-200 text-sm font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────────────────── */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="card overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-center">
                            <h2 className="text-3xl font-black text-white mb-3">
                                Ready to join your campus marketplace?
                            </h2>
                            <p className="text-indigo-100 mb-8">Only takes 10 seconds.</p>
                            <button
                                onClick={handleCTA}
                                className="bg-white text-indigo-600 font-bold py-3 px-8 rounded-full hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2 text-lg"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4f46e5" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#4f46e5" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#4f46e5" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#4f46e5" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {isAuthenticated ? 'Go to Marketplace' : 'Login with Google'}
                            </button>
                        
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────────────────── */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                                    <ShoppingBag size={15} className="text-white" />
                                </div>
                                <span className="text-white font-bold">CampusOLX</span>
                            </div>
                            <p className="text-sm">The trusted marketplace for your college community</p>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <a href="#" className="hover:text-white transition-colors">About</a>
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <a href="#" className="hover:text-white transition-colors">Contact</a>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
                        © {new Date().getFullYear()} CampusOLX. Made with ❤️ for Students.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
