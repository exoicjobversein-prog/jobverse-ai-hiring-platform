import { useEffect, useState, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ROOMS = [
    { key: 'general', label: '# general', desc: 'General discussion' },
    { key: 'interviews', label: '# interviews', desc: 'Interview tips & tricks' },
    { key: 'dsa', label: '# dsa', desc: 'Data structures & algorithms' },
    { key: 'jobs', label: '# jobs', desc: 'Job opportunities' },
];

export default function CommunityChat({ user }) {
    const [room, setRoom] = useState('general');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const wsRef = useRef(null);
    const pollRef = useRef(null);

    useEffect(() => {
        loadMessages();
        // Polling fallback (use WebSocket in production)
        pollRef.current = setInterval(loadMessages, 5000);
        return () => clearInterval(pollRef.current);
    }, [room]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const loadMessages = async () => {
        try {
            const { data } = await api.get(`/community/chat/?room=${room}`);
            setMessages(data);
        } catch { }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        setSending(true);
        try {
            await api.post('/community/chat/', { message: input, room });
            setInput('');
            loadMessages();
        } catch { toast.error('Failed to send message.'); } finally { setSending(false); }
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

    return (
        <div className="flex h-[calc(100vh-10rem)] gap-4">
            {/* Room sidebar */}
            <div className="w-52 flex-shrink-0 flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">Channels</p>
                {ROOMS.map(r => (
                    <button key={r.key} onClick={() => setRoom(r.key)}
                        className={`text-left px-3 py-2.5 rounded-xl text-sm transition-all ${room === r.key ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <p className="font-medium">{r.label}</p>
                        <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
                    </button>
                ))}
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col card p-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2">
                    <MessageSquare size={16} className="text-indigo-400" />
                    <span className="font-semibold text-white">{ROOMS.find(r => r.key === room)?.label}</span>
                    <span className="text-slate-500 text-sm ml-1">—</span>
                    <span className="text-slate-400 text-sm">{ROOMS.find(r => r.key === room)?.desc}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">No messages yet. Say hello! 👋</div>
                    ) : messages.map((m) => {
                        const isMe = m.sender === user?.id;
                        return (
                            <div key={m.id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {(m.sender_name || '?')[0].toUpperCase()}
                                </div>
                                <div className={`max-w-sm group`}>
                                    {!isMe && <p className="text-xs text-slate-500 mb-1 pl-1">{m.sender_name}</p>}
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm text-white ${isMe ? 'bg-indigo-600 rounded-tr-sm' : 'bg-slate-800 rounded-tl-sm'}`}>
                                        {m.message}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 px-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="px-5 py-4 border-t border-slate-800 flex gap-3">
                    <input className="input-field flex-1" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey} placeholder={`Message ${ROOMS.find(r => r.key === room)?.label}…`} />
                    <button onClick={sendMessage} disabled={sending || !input.trim()} className="btn-primary">
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
