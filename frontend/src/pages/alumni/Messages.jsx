import { useState, useRef, useEffect } from 'react';
import { Search, Send, MoreVertical, CheckCheck } from 'lucide-react';

export default function AlumniMessages() {
    const [activeChat, setActiveChat] = useState(1);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    const [users] = useState([
        { id: 1, name: 'Alice Smith', role: 'Student', latest: 'Thank you for the referral!', time: '10:42 AM', unread: 0, online: true },
        { id: 2, name: 'Bob Johnson', role: 'Student', latest: 'Could we schedule a quick chat?', time: 'Yesterday', unread: 2, online: false },
        { id: 3, name: 'Charlie Davis', role: 'Student', latest: 'I have updated my resume.', time: 'Mon', unread: 0, online: true },
    ]);

    const [messageHistory, setMessageHistory] = useState({
        1: [
            { id: 101, senderId: 1, text: 'Hi! I saw your profile and would love to connect.', time: '10:00 AM' },
            { id: 102, senderId: 'me', text: 'Hello Alice, sure thing. How can I help?', time: '10:15 AM' },
            { id: 103, senderId: 1, text: 'I am applying for the Frontend role. Could you review my resume?', time: '10:20 AM' },
            { id: 104, senderId: 'me', text: 'I just took a look, your projects are solid! I will submit a referral for you.', time: '10:35 AM' },
            { id: 105, senderId: 1, text: 'Thank you for the referral!', time: '10:42 AM' },
        ],
        2: [
            { id: 201, senderId: 2, text: 'Hello, I saw your Google Data Analyst post.', time: 'Yesterday' },
            { id: 202, senderId: 2, text: 'Could we schedule a quick chat?', time: 'Yesterday' },
        ],
        3: [
            { id: 301, senderId: 'me', text: 'Charlie, make sure to add your GitHub links to your resume.', time: 'Mon' },
            { id: 302, senderId: 3, text: 'I have updated my resume.', time: 'Mon' },
        ]
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeChat, messageHistory]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage = {
            id: Date.now(),
            senderId: 'me',
            text: input,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessageHistory(prev => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), newMessage]
        }));
        
        setInput('');
    };

    const activeUser = users.find(u => u.id === activeChat);
    const messages = messageHistory[activeChat] || [];

    return (
        <div className="flex h-[calc(100vh-10rem)] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            
            {/* Left sidebar: User List */}
            <div className="w-80 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/50">
                <div className="p-4 border-b border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="text" placeholder="Search messages..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 transition-colors" />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {users.map(u => (
                        <button key={u.id} onClick={() => setActiveChat(u.id)}
                            className={`w-full flex items-start gap-3 p-4 border-b border-slate-800/50 transition-colors text-left
                            ${activeChat === u.id ? 'bg-indigo-950/20' : 'hover:bg-slate-800/30'}`}>
                            
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold">
                                    {u.name[0]}
                                </div>
                                {u.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className={`text-sm truncate ${u.unread > 0 ? 'font-bold text-white' : 'font-semibold text-slate-200'}`}>
                                        {u.name}
                                    </h3>
                                    <span className={`text-[10px] flex-shrink-0 ${u.unread > 0 ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>
                                        {u.time}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={`text-xs truncate ${u.unread > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                                        {u.latest}
                                    </p>
                                    {u.unread > 0 && (
                                        <span className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                                            {u.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right side: Chat Window */}
            {activeUser ? (
                <div className="flex-1 flex flex-col bg-slate-950/30 relative">
                    {/* Chat Header */}
                    <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur z-10 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                                {activeUser.name[0]}
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white leading-tight">{activeUser.name}</h2>
                                <p className="text-xs text-indigo-400 font-medium">{activeUser.role}</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
                            <MoreVertical size={18} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                        {messages.map((m, idx) => {
                            const isMe = m.senderId === 'me';
                            return (
                                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm
                                            ${isMe 
                                                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                                                : 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-sm'
                                            }`}>
                                            {m.text}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1 px-1">
                                            <span className="text-[10px] text-slate-500 font-medium">{m.time}</span>
                                            {isMe && <CheckCheck size={12} className="text-indigo-400" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800 flex-shrink-0">
                        <form onSubmit={handleSend} className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-xl border border-slate-800 focus-within:border-indigo-500/50 transition-all">
                            <input 
                                type="text"
                                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none" 
                                placeholder="Type your message..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim()}
                                className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 transition-colors flex-shrink-0 group">
                                <Send size={16} className={input.trim() ? "translate-x-0.5 -translate-y-0.5 transition-transform" : ""} />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-slate-400">Select a conversation</p>
                    <p className="text-sm">Choose someone from the list to start chatting.</p>
                </div>
            )}
        </div>
    );
}
