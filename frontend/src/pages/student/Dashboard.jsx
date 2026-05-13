import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Briefcase, FileText, ClipboardList, Bot, TrendingUp, ArrowRight,
    Calendar, Clock, CheckCircle, XCircle, Bell, Video, Play,
    Sparkles, Zap, Target, ChevronRight, Star, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SCHEDULE_STATUS_BADGE = {
    Scheduled: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    Accepted: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    Rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Completed: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
    Missed: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const ROUND_LABEL = {
    AI_SCREENING: 'AI Screening',
    TECHNICAL: 'Technical Round',
    FINAL: 'Final Round',
};

function getScheduledDateTime(schedule) {
    return new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`);
}

function getCountdown(scheduledAt, now) {
    const diff = scheduledAt - now;
    if (diff <= 0) return null;
    const totalSecs = Math.floor(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
}

export default function StudentDashboard({ user }) {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ jobs: 0, resumes: 0, applications: 0, interviews: 0 });
    const [schedules, setSchedules] = useState([]);
    const [responding, setResponding] = useState({});
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const ticker = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(ticker);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jobs, resumes, applications, interviews, scheduleRes] = await Promise.allSettled([
                    api.get('/jobs/jobs/'),
                    api.get('/resumes/'),
                    api.get('/jobs/applications/'),
                    api.get('/interviews/interviews/'),
                    api.get('/interviews/schedules/'),
                ]);
                setStats({
                    jobs: jobs.status === 'fulfilled' ? (jobs.value.data?.count ?? jobs.value.data?.length ?? 0) : 0,
                    resumes: resumes.status === 'fulfilled' ? (resumes.value.data?.length ?? 0) : 0,
                    applications: applications.status === 'fulfilled' ? (applications.value.data?.length ?? 0) : 0,
                    interviews: interviews.status === 'fulfilled' ? (interviews.value.data?.length ?? 0) : 0,
                });
                if (scheduleRes.status === 'fulfilled') {
                    setSchedules(scheduleRes.value.data);
                }
            } catch { }
        };
        fetchData();
    }, []);

    const handleRespond = async (scheduleId, response) => {
        setResponding(prev => ({ ...prev, [scheduleId]: true }));
        try {
            const res = await api.post(`/interviews/schedules/${scheduleId}/respond/`, { response });
            setSchedules(prev => prev.map(s => s.id === scheduleId ? res.data : s));
            toast.success(`Interview ${response.toLowerCase()} successfully!`);
        } catch (err) {
            toast.error('Failed to respond. Please try again.');
            console.error(err);
        } finally {
            setResponding(prev => ({ ...prev, [scheduleId]: false }));
        }
    };

    const pendingSchedules = schedules.filter(s => s.status === 'Scheduled');

    const statCards = [
        {
            label: 'Open Jobs',
            value: stats.jobs,
            icon: Briefcase,
            to: '/student/jobs',
            accent: 'indigo',
            description: 'Available positions',
            iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
            glow: 'hover:shadow-indigo-500/10',
            bar: 'from-indigo-500 to-blue-500',
        },
        {
            label: 'My Resumes',
            value: stats.resumes,
            icon: FileText,
            to: '/student/resumes',
            accent: 'violet',
            description: 'Uploaded documents',
            iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
            glow: 'hover:shadow-violet-500/10',
            bar: 'from-violet-500 to-purple-500',
        },
        {
            label: 'Applications',
            value: stats.applications,
            icon: ClipboardList,
            to: '/student/applications',
            accent: 'emerald',
            description: 'Jobs applied to',
            iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
            glow: 'hover:shadow-emerald-500/10',
            bar: 'from-emerald-500 to-teal-500',
        },
        {
            label: 'AI Interviews',
            value: stats.interviews,
            icon: Bot,
            to: '/student/practice',
            accent: 'amber',
            description: 'Sessions completed',
            iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
            glow: 'hover:shadow-amber-500/10',
            bar: 'from-amber-500 to-orange-500',
        },
    ];

    const quickActions = [
        {
            label: 'Browse Jobs',
            to: '/student/jobs',
            icon: Briefcase,
            color: 'indigo',
            description: 'Find your next opportunity',
            badge: `${stats.jobs} open`,
        },
        {
            label: 'Practice Interview',
            to: '/student/practice',
            icon: Bot,
            color: 'violet',
            description: 'AI-powered mock sessions',
            badge: 'AI Powered',
        },
        {
            label: 'Aptitude Test',
            to: '/student/aptitude',
            icon: TrendingUp,
            color: 'emerald',
            description: 'Sharpen your skills',
            badge: 'Practice',
        },
    ];

    const actionColorMap = {
        indigo: 'from-indigo-600/30 to-indigo-600/5 border-indigo-500/20 hover:border-indigo-500/50 text-indigo-400',
        violet: 'from-violet-600/30 to-violet-600/5 border-violet-500/20 hover:border-violet-500/50 text-violet-400',
        emerald: 'from-emerald-600/30 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/50 text-emerald-400',
    };

    const actionBgMap = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20',
        violet: 'bg-violet-500/10 border-violet-500/20',
        emerald: 'bg-emerald-500/10 border-emerald-500/20',
    };

    return (
        <div className="space-y-8 pb-10">

            {/* ── Hero / Welcome Banner ── */}
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-violet-500/10 rounded-full blur-[80px] pointer-events-none transform -translate-x-1/2 translate-y-1/2" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                {getGreeting()}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                                <Sparkles size={11} /> Student Dashboard
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                            {user?.first_name || user?.username}
                            <span className="text-indigo-400"> 👋</span>
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm max-w-md leading-relaxed">
                            {user?.headline || 'Complete your profile to unlock all features and stand out to recruiters.'}
                        </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        <Link to="/student/analytics"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all duration-200">
                            <Activity size={15} /> Analytics
                        </Link>
                        <Link to="/student/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-95">
                            View Profile <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, to, iconBg, glow, bar, description }) => (
                    <Link key={label} to={to}
                        className={`group relative overflow-hidden bg-black border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl ${glow} hover:-translate-y-0.5 cursor-pointer`}>
                        {/* Top gradient tint */}
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${bar.split(' ')[0]}/10 to-transparent rounded-full blur-2xl pointer-events-none`} />

                        <div className="relative">
                            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${iconBg}`}>
                                <Icon size={20} />
                            </div>
                            <p className="text-4xl font-black text-white tracking-tight">{value}</p>
                            <p className="text-sm font-bold text-slate-200 mt-1">{label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>

                            {/* Bottom progress bar */}
                            <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${bar} rounded-full transition-all duration-700`}
                                    style={{ width: value > 0 ? '60%' : '0%' }} />
                            </div>

                            <div className="flex items-center gap-1 mt-2 text-slate-500 text-xs font-semibold group-hover:text-slate-300 transition-colors">
                                View all <ArrowRight size={11} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Interview Invitations Panel ── */}
            {schedules.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Bell size={18} className="text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Interview Invitations</h2>
                            <p className="text-xs text-slate-400">Manage your scheduled interviews</p>
                        </div>
                        {pendingSchedules.length > 0 && (
                            <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-full border border-amber-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {pendingSchedules.length} Pending
                            </span>
                        )}
                    </div>

                    <div className="grid gap-4">
                        {schedules.map(schedule => (
                            <div key={schedule.id}
                                className="group relative overflow-hidden bg-black border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-300 shadow-xl">
                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${schedule.status === 'Accepted' ? 'bg-emerald-500' : schedule.status === 'Rejected' || schedule.status === 'Missed' ? 'bg-red-500' : schedule.status === 'Scheduled' ? 'bg-amber-500' : 'bg-slate-600'}`} />

                                {/* Ambient glow behind accent */}
                                <div className={`absolute left-0 top-0 bottom-0 w-24 opacity-10 blur-2xl pointer-events-none ${schedule.status === 'Accepted' ? 'bg-emerald-500' : schedule.status === 'Scheduled' ? 'bg-amber-500' : 'bg-slate-600'}`} />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="font-bold text-white text-base truncate">
                                                {schedule.job_title || `Job Interview`}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${SCHEDULE_STATUS_BADGE[schedule.status] || 'bg-slate-700 text-slate-400'}`}>
                                                {schedule.status}
                                            </span>
                                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {ROUND_LABEL[schedule.round_type] || schedule.round_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-5 text-sm text-slate-400">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-slate-500" />
                                                {new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={13} className="text-slate-500" />
                                                {schedule.scheduled_time}
                                            </span>
                                        </div>
                                        {schedule.meeting_link && (
                                            <a href={schedule.meeting_link} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-2 transition-colors">
                                                <Video size={12} /> Join Meeting Link →
                                            </a>
                                        )}
                                    </div>

                                    {schedule.status === 'Scheduled' ? (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Accepted')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 active:scale-95"
                                            >
                                                <CheckCircle size={15} />
                                                {responding[schedule.id] ? '...' : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Rejected')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-red-600/80 border border-white/10 hover:border-red-500/50 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-200 active:scale-95"
                                            >
                                                <XCircle size={15} />
                                                {responding[schedule.id] ? '...' : 'Decline'}
                                            </button>
                                        </div>
                                    ) : schedule.status === 'Accepted' ? (
                                        (() => {
                                            const scheduledAt = getScheduledDateTime(schedule);
                                            const countdown = getCountdown(scheduledAt, now);
                                            return countdown ? (
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                        <Clock size={12} className="flex-shrink-0" />
                                                        Starts in {countdown}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/student/interview-warning/${schedule.id}`)}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 animate-pulse hover:animate-none active:scale-95"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        Join AI Interview
                                                    </button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-xl ${schedule.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                                            <XCircle size={14} />
                                            {schedule.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Quick Actions ── */}
            <div className="bg-black border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Zap size={18} className="text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                        <p className="text-xs text-slate-400">Jump to your most-used features</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                    {quickActions.map(({ label, to, icon: Icon, color, description, badge }) => (
                        <Link key={label} to={to}
                            className={`group flex flex-col p-5 rounded-2xl bg-gradient-to-b ${actionColorMap[color]} border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-inner ${actionBgMap[color]}`}>
                                    <Icon size={22} className={actionColorMap[color].split(' ')[4]} />
                                </div>
                                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-black/40 border border-white/10 text-slate-300">
                                    {badge}
                                </span>
                            </div>
                            <p className="text-white font-bold text-base">{label}</p>
                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{description}</p>
                            <div className="flex items-center gap-1 mt-4 text-slate-400 text-xs font-semibold group-hover:text-white transition-colors">
                                Go now <ChevronRight size={12} />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── AI Promo Banner ── */}
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 p-7 shadow-2xl">
                <div className="absolute -top-12 -right-12 w-60 h-60 rounded-full bg-violet-600/10 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-indigo-600/10 blur-[60px] pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-xl shadow-indigo-900/40">
                        <Bot size={26} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <h3 className="font-black text-white text-lg">JobVerse AI Interview Engine</h3>
                            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                ✨ AI Powered
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                            Start a practice interview to sharpen your skills with AI-generated technical questions tailored to your profile.
                        </p>
                    </div>
                    <Link to="/student/practice"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-900/40 flex-shrink-0 active:scale-95 whitespace-nowrap">
                        Start Practicing <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

        </div>
    );
}
