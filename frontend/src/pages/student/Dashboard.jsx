import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, FileText, ClipboardList, Bot, TrendingUp, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function StudentDashboard({ user }) {
    const [stats, setStats] = useState({ jobs: 0, resumes: 0, applications: 0, interviews: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [jobs, resumes, applications, interviews] = await Promise.allSettled([
                    api.get('/jobs/jobs/'),
                    api.get('/resumes/'),
                    api.get('/jobs/applications/'),
                    api.get('/interviews/interviews/'),
                ]);
                setStats({
                    jobs: jobs.status === 'fulfilled' ? (jobs.value.data?.count ?? jobs.value.data?.length ?? 0) : 0,
                    resumes: resumes.status === 'fulfilled' ? (resumes.value.data?.length ?? 0) : 0,
                    applications: applications.status === 'fulfilled' ? (applications.value.data?.length ?? 0) : 0,
                    interviews: interviews.status === 'fulfilled' ? (interviews.value.data?.length ?? 0) : 0,
                });
            } catch { }
        };
        fetchStats();
    }, []);

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
