import { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink, Calendar, Bot, Trophy, ChevronRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_BADGE = {
    PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    REVIEWED: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    SHORTLISTED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
    ACCEPTED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    INTERVIEWING: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
};
const STATUS_LABEL = {
    PENDING: 'Applied',
    REVIEWED: 'Under Review',
    SHORTLISTED: 'Shortlisted',
    REJECTED: 'Rejected',
    ACCEPTED: 'Accepted',
    INTERVIEWING: 'Interviewing',
};
const STATUS_ACCENT = {
    PENDING: 'bg-amber-500',
    REVIEWED: 'bg-indigo-500',
    SHORTLISTED: 'bg-emerald-500',
    REJECTED: 'bg-red-500',
    ACCEPTED: 'bg-emerald-500',
    INTERVIEWING: 'bg-violet-500',
};

export default function StudentApplications({ user }) {
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.allSettled([
            api.get('/jobs/applications/'),
            api.get('/interviews/interviews/'),
        ]).then(([apps, ivs]) => {
            if (apps.status === 'fulfilled') setApplications(apps.value.data);
            if (ivs.status === 'fulfilled') setInterviews(ivs.value.data);
        }).finally(() => setLoading(false));
    }, []);

    const getInterview = (appId) => interviews.find(iv => iv.application === appId);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading your applications…</p>
        </div>
    );

    // Summary counts
    const counts = {
        total: applications.length,
        shortlisted: applications.filter(a => a.status === 'SHORTLISTED').length,
        accepted: applications.filter(a => a.status === 'ACCEPTED').length,
        pending: applications.filter(a => a.status === 'PENDING').length,
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 p-7 shadow-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />
                <div className="relative">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">My Applications</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {counts.total} total · {counts.shortlisted} shortlisted · {counts.accepted} accepted
                    </p>
                </div>
            </div>

            {/* Summary stats */}
            {counts.total > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Applied', value: counts.total, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
                        { label: 'Pending Review', value: counts.pending, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: 'Shortlisted', value: counts.shortlisted, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Accepted', value: counts.accepted, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                    ].map(s => (
                        <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4`}>
                            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                            <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Applications list */}
            {applications.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <ClipboardList size={28} className="text-slate-500" />
                    </div>
                    <p className="font-bold text-slate-300 text-lg">No applications yet</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Apply to jobs from the Job Marketplace to get started</p>
                    <Link to="/student/jobs" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all">
                        <Briefcase size={15} /> Browse Jobs
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map(app => {
                        const iv = getInterview(app.id);
                        const accent = STATUS_ACCENT[app.status] || 'bg-slate-600';
                        return (
                            <div key={app.id} className="group relative overflow-hidden bg-slate-900 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10">
                                {/* Left accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${accent}`} />

                                <div className="pl-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-bold text-base truncate">
                                                {app.job_title || `Job #${app.job}`}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                <Calendar size={11} />
                                                Applied {new Date(app.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 ${STATUS_BADGE[app.status] || 'bg-slate-700 text-slate-400'}`}>
                                            {STATUS_LABEL[app.status] || app.status}
                                        </span>
                                    </div>

                                    {/* AI Interview section */}
                                    {iv && (
                                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                                    <Bot size={15} className="text-indigo-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-medium">AI Interview</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_BADGE[iv.status] || 'bg-slate-700 text-slate-400'}`}>
                                                            {iv.status}
                                                        </span>
                                                        {iv.final_score != null && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                                                                <Trophy size={11} /> {iv.final_score}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {iv.status === 'SCHEDULED' && (
                                                <a href={`/student/interview/${iv.id}`}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95">
                                                    <ExternalLink size={12} /> Start Interview
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
