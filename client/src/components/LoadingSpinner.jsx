const LoadingSpinner = ({ fullPage = false, size = 'md' }) => {
    const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

    if (fullPage) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <div className="flex flex-col items-center gap-3">
                    <div className={`${sizes.lg} border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin`} />
                    <p className="text-sm text-gray-500 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${sizes[size]} border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin`} />
    );
};

export default LoadingSpinner;
