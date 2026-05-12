import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, ShoppingBag } from 'lucide-react';

const Chats = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chatsAPI.getChats()
            .then(({ data }) => setChats(data.chats))
            .catch(() => setChats([]))
            .finally(() => setLoading(false));
    }, []);

    const timeAgo = (date) => {
        if (!date) return '';
        const diff = Date.now() - new Date(date);
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    const getOtherUser = (chat) => {
        return chat.participants?.find(p => p._id !== user?._id) || chat.participants?.[0];
    };

    return (
        <div className="pt-20 pb-12 min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-black text-gray-900 mb-6">Messages</h1>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-4 flex items-center gap-3">
                                <div className="skeleton w-12 h-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton h-4 w-1/2 rounded" />
                                    <div className="skeleton h-3 w-3/4 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="card p-16 text-center">
                        <MessageCircle size={36} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500">No conversations yet</p>
                        <Link to="/marketplace" className="btn-primary mt-4 inline-flex">Browse Items</Link>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {chats.map(chat => {
                            const other = getOtherUser(chat);
                            return (
                                <Link
                                    key={chat._id}
                                    to={`/chat/${chat._id}`}
                                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-all"
                                >
                                    <div className="relative">
                                        <img
                                            src={other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=4f46e5&color=fff&size=50`}
                                            alt={other?.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        {chat.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-semibold text-sm ${chat.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {other?.name}
                                            </p>
                                            <span className="text-xs text-gray-400">{timeAgo(chat.lastMessageAt)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{chat.lastMessage || 'No messages yet'}</p>
                                        {chat.productId && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <ShoppingBag size={10} className="text-indigo-400" />
                                                <span className="text-xs text-indigo-500 truncate">{chat.productId.title}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chats;
