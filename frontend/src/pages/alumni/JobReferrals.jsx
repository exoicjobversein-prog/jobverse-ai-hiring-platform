import { useState } from 'react';
import { Briefcase, Building2, MapPin, Link as LinkIcon, Edit, Trash2, Plus, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function JobReferrals() {
    const [jobs, setJobs] = useState([
        { id: 1, role: 'Software Engineer II', company: 'Google', location: 'Bangalore / Remote', link: 'https://careers.google.com/jobs/results/1234', applications: 12, date: '2 days ago', active: true },
        { id: 2, role: 'Data Analyst Intern', company: 'Google', location: 'Hyderabad', link: 'https://careers.google.com/jobs/results/5678', applications: 45, date: '1 week ago', active: true },
        { id: 3, role: 'Frontend Developer', company: 'Microsoft', location: 'Remote', link: 'https://careers.microsoft.com', applications: 8, date: '2 months ago', active: false },
    ]);

    const toggleStatus = (id) => {
        setJobs(jobs.map(j => j.id === id ? { ...j, active: !j.active } : j));
        toast.success('Job status updated');
    };

    const deleteJob = (id) => {
        setJobs(jobs.filter(j => j.id !== id));
        toast.success('Job referral deleted');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Job Referrals</h1>
                    <p className="text-slate-400 mt-1">Post opportunities and refer students in your network.</p>
                </div>
                <Link to="/alumni/jobs/new" className="btn-primary whitespace-nowrap">
                    <Plus size={18} /> Post Opportunity
                </Link>
            </div>

            {/* List */}
            {jobs.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Briefcase size={32} className="text-slate-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-300">No Job Referrals Yet</h2>
                    <p className="mt-2 text-sm max-w-sm">Help students land their dream jobs by posting open roles at your company.</p>
                    <Link to="/alumni/jobs/new" className="btn-primary mt-6">Create Your First Post</Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => (
                        <div key={job.id} className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col transition-all ${job.active ? 'hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'opacity-70 grayscale-[50%]'}`}>
                            {/* Card Header */}
                            <div className="p-5 border-b border-slate-800 relative">
                                {!job.active && (
                                    <div className="absolute top-3 right-3 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                                        Closed
                                    </div>
                                )}
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-xl font-bold text-slate-900 mb-4 shadow-sm">
                                    {job.company[0]}
                                </div>
                                <h3 className="text-lg font-semibold text-white leading-tight">{job.role}</h3>
                                <p className="text-sm font-medium text-indigo-400 mt-1">{job.company}</p>
                            </div>

                            {/* Details */}
                            <div className="p-5 space-y-3 flex-1">
                                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                    <MapPin size={16} className="text-slate-500 flex-shrink-0" />
                                    <span className="truncate">{job.location}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                    <Users size={16} className="text-slate-500 flex-shrink-0" />
                                    <span>{job.applications} student requests</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-sm text-slate-400">
                                    <LinkIcon size={16} className="text-slate-500 flex-shrink-0" />
                                    <a href={job.link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 truncate transition-colors flex items-center gap-1 group">
                                        View Job Posting <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </div>
                            </div>

                            {/* Actions footer */}
                            <div className="bg-slate-800/30 p-4 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-xs text-slate-500 font-medium">{job.date}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleStatus(job.id)} className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${job.active ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'}`}>
                                        {job.active ? 'Close' : 'Reopen'}
                                    </button>
                                    <button onClick={() => toast('Edit feature coming soon')} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => deleteJob(job.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
