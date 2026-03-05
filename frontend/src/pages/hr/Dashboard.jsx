import { useEffect, useState } from 'react';
import { Users, Briefcase, TrendingUp, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function HRDashboard({ user }) {
    const [stats, setStats] = useState({ jobs: 0, applications: 0, shortlisted: 0, completed: 0 });

    useEffect(() => {
        Promise.allSettled([
            api.get('/jobs/jobs/'),
            api.get('/jobs/applications/'),
        ]).then(([jobs, apps]) => {
            const appData = apps.status === 'fulfilled' ? apps.value.data : [];
            setStats({
                jobs: jobs.status === 'fulfilled' ? jobs.value.data.length : 0,
                applications: appData.length,
                shortlisted: appData.filter(a => a.status === 'SHORTLISTED').length,
                completed: appData.filter(a => a.status === 'ACCEPTED').length,
            });
        });
    }, []);

    const cards = [
        { label: 'Active Jobs', value: stats.jobs, icon: Briefcase, color: 'indigo' },
        { label: 'Total Applicants', value: stats.applications, icon: Users, color: 'violet' },
        { label: 'Shortlisted', value: stats.shortlisted, icon: Star, color: 'emerald' },
        { label: 'Hired', value: stats.completed, icon: TrendingUp, color: 'amber' },
    ];
    const colorMap = { indigo: 'bg-indigo-500/20 text-indigo-400', violet: 'bg-violet-500/20 text-violet-400', emerald: 'bg-emerald-500/20 text-emerald-400', amber: 'bg-amber-500/20 text-amber-400' };

    return (
        <div>
            <h1 className="page-title">HR Dashboard</h1>
            <p className="page-subtitle">Overview of your hiring activity</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card">
                        <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}><Icon size={20} /></div>
                        <p className="text-2xl font-bold text-white">{value}</p>
                        <p className="text-sm text-slate-400">{label}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="card bg-gradient-to-br from-indigo-950/50 to-violet-950/50 border-indigo-500/30">
                    <h3 className="font-bold text-white mb-2">Post a New Job</h3>
                    <p className="text-slate-400 text-sm mb-4">Add a new position to attract AI-screened candidates.</p>
                    <Link to="/hr/jobs/new" className="btn-primary">Post Job</Link>
                </div>
                <div className="card border-emerald-500/20">
                    <h3 className="font-bold text-white mb-2">Review Applications</h3>
                    <p className="text-slate-400 text-sm mb-4">See all applicants with AI resume scores.</p>
                    <Link to="/hr/applications" className="btn-secondary">View Applications</Link>
                </div>
            </div>
        </div>
    );
}
