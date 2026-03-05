import { useEffect, useState } from 'react';
import { ClipboardList, ExternalLink } from 'lucide-react';
import api from '../../services/api';

const STATUS_BADGE = { PENDING: 'badge-amber', REVIEWED: 'badge-indigo', SHORTLISTED: 'badge-emerald', REJECTED: 'badge-red', ACCEPTED: 'badge-emerald', INTERVIEWING: 'badge-violet' };
const STATUS_LABEL = { PENDING: 'Applied', REVIEWED: 'Under Review', SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected', ACCEPTED: 'Accepted', INTERVIEWING: 'Interviewing' };

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

    if (loading) return <div className="text-slate-400 p-10 text-center">Loading…</div>;

    return (
        <div>
            <h1 className="page-title">My Applications</h1>
            <p className="page-subtitle">{applications.length} total applications</p>
            {applications.length === 0 ? (
                <div className="card text-center py-16 text-slate-500">
                    <ClipboardList size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-400">No applications yet</p>
                    <p className="text-sm mt-1">Apply to jobs from the Job Marketplace</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {applications.map(app => {
                        const iv = getInterview(app.id);
                        return (
                            <div key={app.id} className="card">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-white font-bold">{app.job_title || `Job #${app.job}`}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`badge ${STATUS_BADGE[app.status] || 'badge-slate'}`}>{STATUS_LABEL[app.status] || app.status}</span>
                                </div>
                                {iv && (
                                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-400">AI Interview</p>
                                            <span className={`badge mt-1 ${STATUS_BADGE[iv.status] || 'badge-slate'}`}>{iv.status}</span>
                                            {iv.final_score != null && <span className="badge-emerald ml-2">Score: {iv.final_score}%</span>}
                                        </div>
                                        {iv.status === 'SCHEDULED' && (
                                            <a href={`/student/interview/${iv.id}`} className="btn-primary text-sm">
                                                <ExternalLink size={14} />Start Interview
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
