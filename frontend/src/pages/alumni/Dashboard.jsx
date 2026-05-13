import { useState } from 'react';
import { Users, MessageSquare, Briefcase, TrendingUp, Calendar, ChevronRight, CheckCircle2, Search, ArrowUpRight, Plus, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AlumniDashboard({ user }) {
    const [stats] = useState({
        studentsConnected: 42,
        messagesReceived: 18,
        jobsPosted: 3,
        profileViews: 156
    });

    const [recentRequests] = useState([
        { id: 1, name: 'Alice Smith', university: 'Tech University', role: 'Software Engineering Student', date: '2 hours ago' },
        { id: 2, name: 'Bob Johnson', university: 'State College', role: 'Data Science Student', date: '5 hours ago' },
    ]);

    const [recentMessages] = useState([
        { id: 1, sender: 'Emma Wilson', snippet: 'Thank you for the referral! I just got the interview call...', time: '1 hour ago' },
        { id: 2, sender: 'David Lee', snippet: 'Could we schedule a quick 15-min chat next week?', time: '3 hours ago' },
    ]);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header Area */}
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 p-8 shadow-2xl">
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-slate-300">Alumni Portal Active</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                            Welcome back, {user?.first_name || 'Alumni'}! 👋
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-xl">
                            Empower the next generation. Review mentoring requests, respond to messages, and refer top talent to your company.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/alumni/jobs/new" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                            <Plus size={16} /> Post Opportunity
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard title="Network Size" value={stats.studentsConnected} icon={<Users size={22} />} trend="+12% this month" color="indigo" />
                <StatCard title="Unread Messages" value={stats.messagesReceived} icon={<MessageSquare size={22} />} trend="+5 new today" color="emerald" />
                <StatCard title="Active Referrals" value={stats.jobsPosted} icon={<Briefcase size={22} />} trend="1 new posting" color="amber" />
                <StatCard title="Profile Views" value={stats.profileViews} icon={<TrendingUp size={22} />} trend="+24% this week" color="violet" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Requests */}
                <div className="lg:col-span-2 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                    <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Users className="text-indigo-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Mentorship Requests</h2>
                                <p className="text-xs text-slate-400">Students seeking your guidance</p>
                            </div>
                        </div>
                        <Link to="/alumni/requests" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                            View All <ArrowUpRight size={16} />
                        </Link>
                    </div>
                    <div className="p-4 space-y-3 relative z-10">
                        {recentRequests.map(req => (
                            <div key={req.id} className="p-4 bg-[#0a0a0a] hover:bg-white/5 border border-white/5 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-300 font-bold border border-white/10 shadow-inner text-lg">
                                        {req.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">{req.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><Briefcase size={12} /> {req.role}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                                            <span className="text-xs font-medium text-slate-400 flex items-center gap-1"><MapPin size={12} /> {req.university}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 sm:w-auto w-full justify-between sm:justify-end">
                                    <span className="text-xs font-medium text-slate-500">{req.date}</span>
                                    <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors border border-white/10">
                                        <CheckCircle2 size={16} className="text-emerald-400" /> Accept
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="p-6 border-b border-white/10 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <MessageSquare className="text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Recent Inbox</h2>
                                <p className="text-xs text-slate-400">Latest conversations</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 relative z-10 flex-1">
                        {recentMessages.map(msg => (
                            <div key={msg.id} className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl hover:border-emerald-500/30 transition-colors cursor-pointer group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-sm font-bold text-slate-300 border border-white/10">
                                        {msg.sender[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{msg.sender}</h4>
                                            <span className="text-[10px] font-medium text-slate-500 flex-shrink-0 ml-2">{msg.time}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {msg.snippet}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 border-t border-white/10 relative z-10">
                        <Link to="/alumni/messages" className="flex items-center justify-center w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-colors border border-white/10">
                            Open Full Inbox
                        </Link>
                    </div>
                </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-black border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
                <h2 className="text-xl font-bold text-white mb-6 relative z-10">Quick Actions</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    <QuickAction to="/alumni/jobs/new" icon={<Briefcase size={22} />} label="Post Job" color="indigo" />
                    <QuickAction to="/alumni/community" icon={<MessageSquare size={22} />} label="Community" color="emerald" />
                    <QuickAction to="/alumni/profile" icon={<TrendingUp size={22} />} label="Update Profile" color="amber" />
                    <QuickAction to="/alumni/requests" icon={<Calendar size={22} />} label="Schedule" color="violet" />
                </div>
            </div>
        </div>
    );
}

function QuickAction({ to, icon, label, color }) {
    const colorStyles = {
        indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20 hover:border-indigo-500/50',
        emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/50',
        amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20 hover:border-amber-500/50',
        violet: 'from-violet-500/20 to-violet-500/5 text-violet-400 border-violet-500/20 hover:border-violet-500/50',
    };

    return (
        <Link to={to} className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gradient-to-b ${colorStyles[color]} border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}>
            <div className="w-12 h-12 rounded-full bg-black/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {icon}
            </div>
            <span className="text-sm font-bold text-white">{label}</span>
        </Link>
    );
}

function StatCard({ title, value, icon, trend, color }) {
    const colorClasses = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    };

    const gradientClasses = {
        indigo: 'from-indigo-500/20',
        emerald: 'from-emerald-500/20',
        amber: 'from-amber-500/20',
        violet: 'from-violet-500/20'
    };

    return (
        <div className="bg-black p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradientClasses[color]} to-transparent opacity-50 pointer-events-none`} />
            
            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <TrendingUp size={12} className={colorClasses[color].split(' ')[0]} />
                    {trend.split(' ')[0]}
                </div>
            </div>
            
            <div className="relative z-10">
                <p className="text-4xl font-black text-white tracking-tight">{value}</p>
                <p className="text-sm font-semibold text-slate-400 mt-1">{title}</p>
            </div>
            
            {/* Hover Glow */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-0 transition-opacity duration-500 group-hover:opacity-40 ${colorClasses[color].split(' ')[1].replace('/10', '')}`} />
        </div>
    );
}
