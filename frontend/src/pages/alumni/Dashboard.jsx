import { useState, useEffect } from 'react';
import { Users, MessageSquare, Briefcase, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AlumniDashboard({ user }) {
    const [stats, setStats] = useState({
        studentsConnected: 42,
        messagesReceived: 18,
        jobsPosted: 3,
        profileViews: 156
    });

    const [recentRequests, setRecentRequests] = useState([
        { id: 1, name: 'Alice Smith', university: 'Tech University', role: 'Software Engineering Student', date: '2 hours ago' },
        { id: 2, name: 'Bob Johnson', university: 'State College', role: 'Data Science Student', date: '5 hours ago' },
    ]);

    const [recentMessages, setRecentMessages] = useState([
        { id: 1, sender: 'Emma Wilson', snippet: 'Thank you for the referral! I just got the interview call...', time: '1 hour ago' },
        { id: 2, sender: 'David Lee', snippet: 'Could we schedule a quick 15-min chat next week?', time: '3 hours ago' },
    ]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome back, {user?.first_name || 'Alumni'}! 👋</h1>
                    <p className="text-slate-400 mt-1">Here is what is happening with your network today.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                    <button className="px-3 py-1.5 text-sm font-medium bg-slate-700 text-white rounded shadow-sm">Overview</button>
                    <button className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors">Analytics</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                <StatCard title="Students Connected" value={stats.studentsConnected} icon={<Users size={20} />} trend="+12% this month" color="indigo" />
                <StatCard title="Recent Messages" value={stats.messagesReceived} icon={<MessageSquare size={20} />} trend="+5 new today" color="emerald" />
                <StatCard title="Jobs Posted" value={stats.jobsPosted} icon={<Briefcase size={20} />} trend="1 active" color="amber" />
                <StatCard title="Profile Views" value={stats.profileViews} icon={<TrendingUp size={20} />} trend="+24% this week" color="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Requests */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="text-indigo-400" size={18} />
                            <h2 className="text-lg font-semibold text-white">Recent Student Requests</h2>
                        </div>
                        <Link to="/alumni/requests" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center">
                            View all <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="p-2 space-y-1">
                        {recentRequests.map(req => (
                            <div key={req.id} className="p-3 hover:bg-slate-800/50 rounded-lg transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                                        {req.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-200">{req.name}</h3>
                                        <p className="text-xs text-slate-400">{req.role} • {req.university}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 mr-2 hidden sm:block">{req.date}</span>
                                    <button className="btn-primary text-xs py-1.5 px-3">Accept</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="text-emerald-400" size={18} />
                            <h2 className="text-lg font-semibold text-white">Inbox</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        {recentMessages.map(msg => (
                            <div key={msg.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-300">
                                    {msg.sender[0]}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-slate-200">{msg.sender}</h4>
                                        <span className="text-[10px] text-slate-500">{msg.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                        {msg.snippet}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-800 mt-auto">
                        <Link to="/alumni/messages" className="btn-secondary w-full text-sm">Open Messages</Link>
                    </div>
                </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link to="/alumni/jobs/new" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Briefcase size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-300">Post Job</span>
                    </Link>
                    <Link to="/alumni/community" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageSquare size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-300">Community</span>
                    </Link>
                    <Link to="/alumni/profile" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-300">Update Profile</span>
                    </Link>
                    <Link to="/alumni/requests" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Calendar size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-300">Schedule</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }) {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 text-indigo-400',
        emerald: 'bg-emerald-500/10 text-emerald-400',
        amber: 'bg-amber-500/10 text-amber-400',
        violet: 'bg-violet-500/10 text-violet-400'
    };

    return (
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="relative z-10 flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="text-3xl font-bold text-white mt-2">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
            <div className="relative z-10 mt-4 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <span className={colorClasses[color].split(' ')[1]}>{trend}</span>
            </div>
            {/* Background glow decoration */}
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20 ${colorClasses[color].split(' ')[0].replace('/10', '')}`}></div>
        </div>
    );
}
