import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { chatsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, ChevronLeft, ShoppingBag } from 'lucide-react';

const ChatDetail = () => {
    const { id } = useParams();
    const { user, socket } = useAuth();
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [typing, setTyping] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const bottomRef = useRef();
    const typingRef = useRef();

    useEffect(() => {
        fetchData();
        if (socket) {
            socket.emit('joinChat', id);
            socket.on('newMessage', (msg) => {
                // Avoid duplicate messages when the sender receives their own socket event
                setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
                scrollToBottom();
            });
            socket.on('userTyping', ({ isTyping }) => setOtherTyping(isTyping));
            return () => {
                socket.emit('leaveChat', id);
                socket.off('newMessage');
                socket.off('userTyping');
            };
        }
    }, [id, socket]);

    const fetchData = async () => {
        try {
            const msgRes = await chatsAPI.getMessages(id);
            setMessages(msgRes.data.messages);
        } catch {
            setMessages([]);
        } finally {
            setLoading(false);
        }
        // Also get chats to find current chat info
        try {
            const { data } = await chatsAPI.getChats();
            const currentChat = data.chats.find(c => c._id === id);
            setChat(currentChat);
        } catch { }
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    const handleTyping = (val) => {
        setText(val);
        if (socket) {
            socket.emit('typing', { chatId: id, userId: user._id, isTyping: val.length > 0 });
            clearTimeout(typingRef.current);
            typingRef.current = setTimeout(() => {
                socket.emit('typing', { chatId: id, userId: user._id, isTyping: false });
            }, 1500);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || sending) return;
        setSending(true);
        try {
            const { data } = await chatsAPI.sendMessage(id, text.trim());
            // If the socket echo arrives first we might already have this _id
            setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]);
            setText('');
            scrollToBottom();
        } catch { } finally { setSending(false); }
    };

    const formatTime = (date) => new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const getOtherUser = () => {
        return chat?.participants?.find(p => p._id !== user?._id) || chat?.participants?.[0];
    };

    const other = getOtherUser();

    return (
        <div className="pt-16 min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 fixed top-16 left-0 right-0 z-40">
                <Link to="/chats" className="text-gray-500 hover:text-indigo-600 p-1">
                    <ChevronLeft size={20} />
                </Link>
                {other && (
                    <>
                        <img
                            src={other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.name || 'U')}&background=4f46e5&color=fff&size=40`}
                            alt={other?.name}
                            className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                            <p className="font-semibold text-sm text-gray-900">{other?.name}</p>
                            {otherTyping && <p className="text-xs text-green-500 animate-pulse">typing...</p>}
                        </div>
                    </>
                )}
                {chat?.productId && (
                    <Link to={`/product/${chat.productId._id}`} className="ml-auto flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-indigo-100">
                        <ShoppingBag size={12} />
                        <span className="truncate max-w-24">{chat.productId.title}</span>
                    </Link>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 mt-32 mb-20 space-y-3">
                {loading ? (
                    <div className="flex justify-center mt-10">
                        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center mt-20 text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                        return (
                            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <img
                                        src={msg.senderId?.profilePic || `https://ui-avatars.com/api/?name=U&background=4f46e5&color=fff&size=32`}
                                        className="w-7 h-7 rounded-full object-cover mr-2 mt-auto flex-shrink-0"
                                    />
                                )}
                                <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.message}</p>
                                    <p className={`text-[11px] mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
                <form onSubmit={handleSend} className="flex items-center gap-3 max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={text}
                        onChange={e => handleTyping(e.target.value)}
                        placeholder="Type a message..."
                        className="input flex-1 py-2.5"
                    />
                    <button
                        type="submit"
                        disabled={!text.trim() || sending}
                        className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 hover:bg-indigo-700 transition-colors flex-shrink-0"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatDetail;
