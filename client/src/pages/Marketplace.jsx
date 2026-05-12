import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { productsAPI } from '../api';
import { Search, Filter, SlidersHorizontal, ShoppingBag, CheckCircle, Clock, X, ChevronDown } from 'lucide-react';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Cycles', 'Stationery', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Used'];
const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
];

const ProductCard = ({ product }) => {
    const timeAgo = (date) => {
        const diff = Date.now() - new Date(date);
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <Link to={`/product/${product._id}`} className="card overflow-hidden group hover:-translate-y-1 transition-all duration-300 block">
            <div className="relative">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-44 bg-gray-100 flex items-center justify-center">
                        <ShoppingBag size={28} className="text-gray-300" />
                    </div>
                )}
                <div className="absolute top-2 left-2">
                    <span className={`badge text-xs ${product.condition === 'New' ? 'badge-green' :
                            product.condition === 'Like New' ? 'badge-indigo' : 'badge-gray'
                        }`}>
                        {product.condition}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <p className="font-semibold text-gray-900 text-sm truncate mb-1">{product.title}</p>
                <div className="flex items-center gap-2">
                    <p className="text-indigo-600 font-black text-lg">₹{product.price.toLocaleString()}</p>
                    {product.mrp && (
                        <p className="text-gray-400 text-sm line-through">₹{product.mrp.toLocaleString()}</p>
                    )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                        <img
                            src={product.sellerId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.sellerId?.name || 'S')}&background=4f46e5&color=fff&size=32`}
                            alt={product.sellerId?.name}
                            className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs text-gray-500 truncate max-w-20">{product.sellerId?.name?.split(' ')[0]}</span>
                        {product.sellerId?.isVerifiedSeller && (
                            <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                        )}
                    </div>
                    <span className="text-xs text-gray-400">{timeAgo(product.createdAt)}</span>
                </div>
            </div>
        </Link>
    );
};

const SkeletonCard = () => (
    <div className="card overflow-hidden">
        <div className="skeleton h-44" />
        <div className="p-4 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-5 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/2 rounded mt-3" />
        </div>
    </div>
);

const Marketplace = () => {
    const { cat } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: cat || searchParams.get('category') || '',
        condition: '',
        sort: 'newest',
        minPrice: '',
        maxPrice: '',
        page: 1
    });

    useEffect(() => {
        if (cat) setFilters(f => ({ ...f, category: cat, page: 1 }));
    }, [cat]);

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.category) params.category = filters.category;
            if (filters.condition) params.condition = filters.condition;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;
            params.sort = filters.sort;
            params.page = filters.page;
            params.limit = 12;

            const { data } = await productsAPI.getAll(params);
            setProducts(data.products);
            setTotal(data.total);
            setPages(data.pages);
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const updateFilter = (key, value) => {
        setFilters(f => ({ ...f, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ search: '', category: '', condition: '', sort: 'newest', minPrice: '', maxPrice: '', page: 1 });
    };

    const activeFilters = [filters.category, filters.condition, filters.minPrice, filters.maxPrice].filter(Boolean).length;

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 my-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">
                            {filters.category ? `${filters.category}` : 'Marketplace'}
                        </h1>
                        <p className="text-gray-500 text-sm">{total} items available</p>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={filters.search}
                                onChange={e => updateFilter('search', e.target.value)}
                                placeholder="Search items..."
                                className="input pl-9 py-2"
                            />
                        </div>
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className={`relative p-2.5 rounded-lg border-2 transition-all ${filterOpen || activeFilters > 0
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                                }`}
                        >
                            <SlidersHorizontal size={18} />
                            {activeFilters > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {activeFilters}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filters panel */}
                {filterOpen && (
                    <div className="card p-5 mb-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Filters</h3>
                            <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                                <X size={14} /> Clear all
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* Category */}
                            <div>
                                <label className="label">Category</label>
                                <select
                                    value={filters.category}
                                    onChange={e => updateFilter('category', e.target.value)}
                                    className="input py-2 text-sm"
                                >
                                    <option value="">All Categories</option>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Condition */}
                            <div>
                                <label className="label">Condition</label>
                                <select
                                    value={filters.condition}
                                    onChange={e => updateFilter('condition', e.target.value)}
                                    className="input py-2 text-sm"
                                >
                                    <option value="">Any Condition</option>
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            {/* Price */}
                            <div>
                                <label className="label">Min Price (₹)</label>
                                <input type="number" value={filters.minPrice} onChange={e => updateFilter('minPrice', e.target.value)} className="input py-2 text-sm" placeholder="0" />
                            </div>
                            <div>
                                <label className="label">Max Price (₹)</label>
                                <input type="number" value={filters.maxPrice} onChange={e => updateFilter('maxPrice', e.target.value)} className="input py-2 text-sm" placeholder="99999" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Sort bar */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                    {/* Category chips */}
                    <button
                        onClick={() => updateFilter('category', '')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!filters.category ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                            }`}
                    >
                        All
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filters.category === cat ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}

                    <div className="ml-auto">
                        <select
                            value={filters.sort}
                            onChange={e => updateFilter('sort', e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* Products grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="card p-16 text-center">
                        <ShoppingBag size={40} className="text-gray-200 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No items found</h3>
                        <p className="text-gray-500 text-sm">Try changing your filters or search term</p>
                        <button onClick={clearFilters} className="btn-primary mt-4">Clear Filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map(p => <ProductCard key={p._id} product={p} />)}
                    </div>
                )}

                {/* Pagination */}
                {pages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {Array.from({ length: pages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setFilters(f => ({ ...f, page }))}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${filters.page === page ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;
