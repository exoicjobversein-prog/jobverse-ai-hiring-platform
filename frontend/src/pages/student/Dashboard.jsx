import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Briefcase, FileText, ClipboardList, Bot, TrendingUp, ArrowRight,
    Calendar, Clock, CheckCircle, XCircle, Bell, Video, Play,
    Sparkles, Zap, Target, ChevronRight
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

// Returns a JS Date from a schedule's date + time strings
function getScheduledDateTime(schedule) {
    // scheduled_date: 'YYYY-MM-DD', scheduled_time: 'HH:MM:SS' or 'HH:MM'
    return new Date(`${schedule.scheduled_date}T${schedule.scheduled_time}`);
}

// Returns a human-readable countdown string, or null if time has arrived
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

// Greeting based on time of day
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

    // Tick every second so countdown / unlock happens in real-time
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
            gradient: 'from-indigo-500 to-blue-600',
            glow: 'shadow-indigo-500/20',
            bg: 'bg-indigo-500/10',
            border: 'border-indigo-500/20',
            text: 'text-indigo-400',
            description: 'Available positions'
        },
        {
            label: 'My Resumes',
            value: stats.resumes,
            icon: FileText,
            to: '/student/resumes',
            gradient: 'from-violet-500 to-purple-600',
            glow: 'shadow-violet-500/20',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
            text: 'text-violet-400',
            description: 'Uploaded documents'
        },
        {
            label: 'Applications',
            value: stats.applications,
            icon: ClipboardList,
            to: '/student/applications',
            gradient: 'from-emerald-500 to-teal-600',
            glow: 'shadow-emerald-500/20',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            text: 'text-emerald-400',
            description: 'Jobs applied to'
        },
        {
            label: 'AI Interviews',
            value: stats.interviews,
            icon: Bot,
            to: '/student/practice',
            gradient: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/20',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            text: 'text-amber-400',
            description: 'Sessions completed'
        },
    ];

    const quickActions = [
        {
            label: 'Browse Jobs',
            to: '/student/jobs',
            icon: Briefcase,
            gradient: 'from-indigo-600 to-blue-600',
            hoverGradient: 'hover:from-indigo-500 hover:to-blue-500',
            description: 'Find your next opportunity'
        },
        {
            label: 'Practice Interview',
            to: '/student/practice',
            icon: Bot,
            gradient: 'from-violet-600 to-purple-600',
            hoverGradient: 'hover:from-violet-500 hover:to-purple-500',
            description: 'AI-powered mock sessions'
        },
        {
            label: 'Aptitude Test',
            to: '/student/aptitude',
            icon: TrendingUp,
            gradient: 'from-emerald-600 to-teal-600',
            hoverGradient: 'hover:from-emerald-500 hover:to-teal-500',
            description: 'Sharpen your skills'
        },
    ];

    return (
        <div className="space-y-8">

            {/* ── Hero / Welcome Banner ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 p-8 shadow-2xl">
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                                <Sparkles size={11} />
                                {getGreeting()}
                            </span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            {user?.first_name || user?.username} 
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm max-w-md">
                            {user?.headline || 'Complete your profile to unlock all features and stand out to recruiters.'}
                        </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        <Link to="/student/profile"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all duration-200 backdrop-blur-sm">
                            View Profile <ChevronRight size={15} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Interview Invitations Panel ── */}
            {schedules.length > 0 && (
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Bell size={16} className="text-amber-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white">Interview Invitations</h2>
                        {pendingSchedules.length > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {pendingSchedules.length} Pending
                            </span>
                        )}
                    </div>

                    <div className="grid gap-3">
                        {schedules.map(schedule => (
                            <div key={schedule.id}
                                className="group relative overflow-hidden bg-slate-900 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 shadow-xl">
                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${schedule.status === 'Accepted' ? 'bg-emerald-500' : schedule.status === 'Rejected' || schedule.status === 'Missed' ? 'bg-red-500' : schedule.status === 'Scheduled' ? 'bg-amber-500' : 'bg-slate-600'}`} />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <h3 className="font-bold text-white text-base truncate">
                                                {schedule.job_title || `Job Interview`}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${SCHEDULE_STATUS_BADGE[schedule.status] || 'bg-slate-700 text-slate-400'}`}>
                                                {schedule.status}
                                            </span>
                                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
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
                                                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-2 transition-colors">
                                                <Video size={12} /> Join Meeting Link →
                                            </a>
                                        )}
                                    </div>

                                    {/* Action Buttons — only show if still pending */}
                                    {schedule.status === 'Scheduled' ? (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Accepted')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-200 shadow-lg shadow-emerald-900/30 active:scale-95"
                                            >
                                                <CheckCircle size={15} />
                                                {responding[schedule.id] ? '...' : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Rejected')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all duration-200 active:scale-95"
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
                                                // Time hasn't arrived yet — show countdown
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25">
                                                        <Clock size={12} className="flex-shrink-0" />
                                                        Starts in {countdown}
                                                    </div>
                                                </div>
                                            ) : (
                                                // Time has arrived — show the interview entry button
                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/student/interview-warning/${schedule.id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40 animate-pulse hover:animate-none active:scale-95"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        Join AI Interview
                                                    </button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-xl ${schedule.status === 'Rejected' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-slate-700 text-slate-400'}`}>
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

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, gradient, glow, bg, border, text, description, to }) => (
                    <Link key={label} to={to}
                        className={`group relative overflow-hidden bg-slate-900 border ${border} hover:border-opacity-60 rounded-2xl p-5 transition-all duration-300 hover:shadow-2xl ${glow} hover:-translate-y-0.5 cursor-pointer`}>
                        {/* Subtle gradient background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />

                        <div className="relative">
                            <div className={`w-11 h-11 rounded-xl ${bg} border ${border} flex items-center justify-center mb-4`}>
                                <Icon size={20} className={text} />
                            </div>
                            <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
                            <p className="text-sm font-semibold text-slate-200 mt-0.5">{label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                            <div className={`flex items-center gap-1 mt-3 ${text} text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                                View all <ArrowRight size={12} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── Quick Actions ── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Zap size={16} className="text-indigo-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {quickActions.map(({ label, to, icon: Icon, gradient, hoverGradient, description }) => (
                        <Link key={label} to={to}
                            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} ${hoverGradient} p-5 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95`}>
                            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                                    <Icon size={20} className="text-white" />
                                </div>
                                <p className="text-white font-bold text-sm">{label}</p>
                                <p className="text-white/60 text-xs mt-0.5">{description}</p>
                                <div className="flex items-center gap-1 mt-3 text-white/80 text-xs font-semibold group-hover:text-white transition-colors">
                                    Go now <ChevronRight size={12} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* ── AI Promo Banner ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-900 border border-violet-500/20 p-6 shadow-2xl">
                <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/50">
                        <Bot size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-extrabold text-white text-base">JobVerse AI Interview Engine</h3>
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-violet-500/30 text-violet-300 border border-violet-500/30">
                                AI Powered
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Start a practice interview to sharpen your skills with AI-generated technical questions tailored to your profile.
                        </p>
                    </div>
                    <Link to="/student/practice"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold transition-all duration-200 shadow-lg shadow-indigo-900/40 flex-shrink-0 active:scale-95">
                        Start Practicing <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

        </div>
    );
}
