import { useState } from 'react';
import { Bell, CheckCircle, Info, AlertTriangle, Briefcase, Mail, MessageSquare } from 'lucide-react';

export default function Notifications() {
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'connection', title: 'New Connection Request', message: 'Alice Smith wants to connect with you.', time: '2 mins ago', read: false, icon: Mail, color: 'indigo' },
        { id: 2, type: 'message', title: 'New Direct Message', message: 'David Lee sent you a message: "Could we schedule a quick chat?"', time: '3 hours ago', read: false, icon: MessageSquare, color: 'emerald' },
        { id: 3, type: 'job', title: 'Job Referral Update', message: '3 new students applied for the Data Analyst referral link.', time: '1 day ago', read: true, icon: Briefcase, color: 'amber' },
        { id: 4, type: 'system', title: 'Profile Complete', message: 'Your alumni profile is now visible in the directory.', time: '2 days ago', read: true, icon: CheckCircle, color: 'blue' },
    ]);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const markRead = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getColorClasses = (color) => {
        const classes = {
            indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        };
        return classes[color] || classes.blue;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        Notifications 
                        {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                    </h1>
                    <p className="text-slate-400 mt-1">Stay updated with your alumni network.</p>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No notifications yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {notifications.map(note => {
                            const IconCard = note.icon;
                            return (
                                <div key={note.id} 
                                    onClick={() => markRead(note.id)}
                                    className={`p-4 md:p-5 flex gap-4 transition-colors cursor-pointer relative overflow-hidden group hover:bg-slate-800/30 ${note.read ? '' : 'bg-indigo-950/20'}`}>
                                    
                                    {!note.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                                    )}

                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getColorClasses(note.color)}`}>
                                        <IconCard size={18} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <h3 className={`text-sm font-medium truncate ${note.read ? 'text-slate-300' : 'text-slate-100 font-semibold'}`}>
                                                {note.title}
                                            </h3>
                                            <span className="text-[10px] text-slate-500 flex-shrink-0 whitespace-nowrap">
                                                {note.time}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                                            {note.message}
                                        </p>
                                    </div>
                                    
                                    {!note.read && (
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
