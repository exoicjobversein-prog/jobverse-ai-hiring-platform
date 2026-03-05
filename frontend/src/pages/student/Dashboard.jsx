import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Briefcase, FileText, ClipboardList, Bot, TrendingUp, ArrowRight, Calendar, Clock, CheckCircle, XCircle, Bell, Video, Play } from 'lucide-react';
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
        { label: 'Open Jobs', value: stats.jobs, icon: Briefcase, color: 'indigo', to: '/student/jobs' },
        { label: 'My Resumes', value: stats.resumes, icon: FileText, color: 'violet', to: '/student/resumes' },
        { label: 'Applications', value: stats.applications, icon: ClipboardList, color: 'emerald', to: '/student/applications' },
        { label: 'AI Interviews', value: stats.interviews, icon: Bot, color: 'amber', to: '/student/practice' },
    ];

    const colorMap = { indigo: 'bg-indigo-500/20 text-indigo-400', violet: 'bg-violet-500/20 text-violet-400', emerald: 'bg-emerald-500/20 text-emerald-400', amber: 'bg-amber-500/20 text-amber-400' };

    const quickActions = [
        { label: 'Browse Jobs', to: '/student/jobs', color: 'btn-primary', icon: Briefcase },
        { label: 'Practice Interview', to: '/student/practice', color: 'btn-secondary', icon: Bot },
        { label: 'Aptitude Test', to: '/student/aptitude', color: 'btn-secondary', icon: TrendingUp },
    ];

    return (
        <div>
            {/* Welcome */}
            <div className="mb-8">
                <h1 className="page-title">Welcome back, {user?.first_name || user?.username} 👋</h1>
                <p className="page-subtitle">{user?.headline || 'Complete your profile to unlock all features.'}</p>
            </div>

            {/* Interview Invitations Panel */}
            {schedules.length > 0 && (
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                        <Bell size={18} className="text-indigo-400" />
                        <h2 className="section-title mb-0">Interview Invitations</h2>
                        {pendingSchedules.length > 0 && (
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                {pendingSchedules.length} Pending
                            </span>
                        )}
                    </div>
                    <div className="grid gap-3">
                        {schedules.map(schedule => (
                            <div key={schedule.id} className="card border border-slate-700/50">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-bold text-white truncate">{schedule.job_title || `Job Interview`}</h3>
                                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${SCHEDULE_STATUS_BADGE[schedule.status] || 'bg-slate-700 text-slate-400'}`}>
                                                {schedule.status}
                                            </span>
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                                {ROUND_LABEL[schedule.round_type] || schedule.round_type}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={13} />
                                                {new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={13} />
                                                {schedule.scheduled_time}
                                            </span>
                                        </div>
                                        {schedule.meeting_link && (
                                            <a href={schedule.meeting_link} target="_blank" rel="noreferrer"
                                                className="text-xs text-indigo-400 hover:underline mt-1 inline-block">
                                                Join Meeting Link →
                                            </a>
                                        )}
                                    </div>

                                    {/* Action Buttons — only show if still pending */}
                                    {schedule.status === 'Scheduled' ? (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Accepted')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                <CheckCircle size={15} />
                                                {responding[schedule.id] ? '...' : 'Accept'}
                                            </button>
                                            <button
                                                onClick={() => handleRespond(schedule.id, 'Rejected')}
                                                disabled={responding[schedule.id]}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
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
                                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25">
                                                        <Clock size={12} className="flex-shrink-0" />
                                                        Starts in {countdown}
                                                    </div>
                                                </div>
                                            ) : (
                                                // Time has arrived — show the interview entry button
                                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400">
                                                        <CheckCircle size={13} /> Accepted
                                                    </div>
                                                    <button
                                                        onClick={() => navigate(`/student/interview-warning/${schedule.id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-900/40 animate-pulse hover:animate-none"
                                                    >
                                                        <Play size={14} fill="currentColor" />
                                                        Join AI Interview
                                                    </button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg ${schedule.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>
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

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(({ label, value, icon: Icon, color, to }) => (
                    <Link key={label} to={to} className="card-hover group">
                        <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
                            <Icon size={20} />
                        </div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-sm text-slate-400">{label}</p>
                    </Link>
                ))}
            </div>

            {/* Quick actions */}
            <div className="card mb-8">
                <h2 className="section-title">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {quickActions.map(({ label, to, color, icon: Icon }) => (
                        <Link key={label} to={to} className={color}>
                            <Icon size={16} />{label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="card bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border-indigo-500/30">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Bot size={20} className="text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">JobVerse AI Interview Engine</h3>
                        <p className="text-slate-400 text-sm">Start a practice interview to sharpen your skills with AI-generated technical questions tailored to your profile.</p>
                        <Link to="/student/practice" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-2">
                            Start Practicing <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
