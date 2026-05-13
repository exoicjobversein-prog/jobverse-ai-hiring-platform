import { useEffect, useState } from 'react';
import { MapPin, Briefcase, Search, Filter, ChevronDown, Star, X, FileText, Building2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function JobMarketplace() {
    const [jobs, setJobs] = useState([]);
    const [resumes, setResumes] = useState([]);
    const [filters, setFilters] = useState({ search: '', location: '', experience: '', domain: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [loadingApply, setLoadingApply] = useState({});
    const [applied, setApplied] = useState({});

    // Resume picker modal
    const [applyModal, setApplyModal] = useState(null); // { job }
    const [selectedResume, setSelectedResume] = useState('');

    useEffect(() => {
        api.get('/jobs/jobs/').then(r => setJobs(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => { });
        api.get('/resumes/').then(r => setResumes(Array.isArray(r.data) ? r.data : r.data.results || [])).catch(() => { });
        api.get('/jobs/applications/').then(r => {
            const map = {};
            (Array.isArray(r.data) ? r.data : r.data.results || []).forEach(a => { map[a.job] = a.status; });
            setApplied(map);
        }).catch(() => { });
    }, []);

    const setFilter = field => e => setFilters(f => ({ ...f, [field]: e.target.value }));

    const filtered = jobs.filter(j => {
        const q = filters.search.toLowerCase();
        return (
            (!q || j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q) || (j.domain || '').toLowerCase().includes(q)) &&
            (!filters.location || (j.location || '').toLowerCase().includes(filters.location.toLowerCase())) &&
            (!filters.experience || (j.experience || '').toLowerCase().includes(filters.experience.toLowerCase())) &&
            (!filters.domain || (j.domain || '').toLowerCase().includes(filters.domain.toLowerCase()))
        );
    });

    const openApplyModal = (job) => {
        if (resumes.length === 0) {
            toast.error('Please upload a resume first from the "My Resumes" page.');
            return;
        }
        setSelectedResume(resumes[0].id.toString());
        setApplyModal({ job });
    };

    const confirmApply = async () => {
        if (!applyModal) return;
        const { job } = applyModal;
        setLoadingApply(prev => ({ ...prev, [job.id]: true }));
        try {
            await api.post(`/jobs/jobs/${job.id}/apply/`, { resume_id: selectedResume });
            setApplied(prev => ({ ...prev, [job.id]: 'PENDING' }));
            toast.success(`Applied to "${job.title}" successfully!`);
            setApplyModal(null);
        } catch (err) {
            const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Application failed.';
            toast.error(msg);
        } finally {
            setLoadingApply(prev => ({ ...prev, [job.id]: false }));
        }
    };

    const STATUS_BADGE = {
        PENDING: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        REVIEWED: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        SHORTLISTED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        REJECTED: 'bg-red-500/20 text-red-400 border border-red-500/30',
        ACCEPTED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    };
    const STATUS_LABEL = {
        PENDING: 'Applied',
        REVIEWED: 'Under Review',
        SHORTLISTED: 'Shortlisted',
        REJECTED: 'Rejected',
        ACCEPTED: 'Accepted',
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/20 p-7 shadow-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
                <div className="relative flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <Briefcase size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Job Marketplace</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {filtered.length} position{filtered.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
            </div>

            {/* No resume warning */}
            {resumes.length === 0 && (
                <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/25 rounded-2xl p-4">
                    <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300">
                        You haven't uploaded a resume yet.{' '}
                        <Link to="/student/resumes" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
                            Upload one first
                        </Link>{' '}
                        to apply for jobs.
                    </p>
                </div>
            )}

            {/* Search & Filter */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Search jobs, skills, domain…"
                            value={filters.search}
                            onChange={setFilter('search')}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${showFilters
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                    >
                        <Filter size={15} />
                        Filters
                        {activeFilterCount > 1 && (
                            <span className="w-4 h-4 rounded-full bg-white text-indigo-700 text-xs font-bold flex items-center justify-center">
                                {activeFilterCount - (filters.search ? 1 : 0)}
                            </span>
                        )}
                        <ChevronDown size={13} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
                        {[
                            { key: 'location', label: 'Location', placeholder: 'e.g. Bangalore' },
                            { key: 'experience', label: 'Experience', placeholder: 'e.g. 2-4 years' },
                            { key: 'domain', label: 'Domain', placeholder: 'e.g. Backend' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
                                <input
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                                    placeholder={placeholder}
                                    value={filters[key]}
                                    onChange={setFilter(key)}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Job Cards */}
            {filtered.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={28} className="text-slate-500" />
                    </div>
                    <p className="font-bold text-slate-300 text-lg">No jobs match your filters</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Try adjusting or clearing your filters</p>
                    <button
                        onClick={() => setFilters({ search: '', location: '', experience: '', domain: '' })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-all"
                    >
                        <X size={14} /> Clear Filters
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(job => (
                        <div key={job.id}
                            className="group relative overflow-hidden bg-slate-900 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5">

                            <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-4 flex-1 min-w-0">
                                    {/* Company icon placeholder */}
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                                        <Building2 size={18} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="text-white font-bold text-base">{job.title}</h3>
                                            {job.domain && (
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                                    {job.domain}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                                            {job.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin size={11} className="text-slate-500" /> {job.location}
                                                </span>
                                            )}
                                            {job.experience && (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={11} className="text-slate-500" /> {job.experience}
                                                </span>
                                            )}
                                            {job.salary && (
                                                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                                                    <Star size={11} /> {job.salary}
                                                </span>
                                            )}
                                            {job.technology_stack && (
                                                <span className="flex items-center gap-1">
                                                    🛠 {job.technology_stack}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{job.description}</p>
                                    </div>
                                </div>

                                {/* Apply button / status */}
                                <div className="flex-shrink-0">
                                    {applied[job.id] ? (
                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full ${STATUS_BADGE[applied[job.id]] || 'bg-slate-700 text-slate-400'}`}>
                                            {STATUS_LABEL[applied[job.id]] || applied[job.id]}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => openApplyModal(job)}
                                            disabled={loadingApply[job.id]}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 active:scale-95"
                                        >
                                            {loadingApply[job.id]
                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : <><Sparkles size={13} /> Apply Now</>
                                            }
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Apply Modal */}
            {applyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-white font-extrabold text-lg">Apply for Position</h2>
                                <p className="text-indigo-400 text-sm font-medium mt-0.5">"{applyModal.job.title}"</p>
                            </div>
                            <button onClick={() => setApplyModal(null)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="mb-5">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Select Resume to Submit
                            </label>
                            {resumes.length === 0 ? (
                                <p className="text-amber-400 text-sm">No resumes found. Please upload a resume first.</p>
                            ) : (
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all appearance-none cursor-pointer"
                                    value={selectedResume}
                                    onChange={e => setSelectedResume(e.target.value)}
                                >
                                    {resumes.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.file?.split('/').pop() || `Resume #${r.id}`}
                                            {r.technical_score != null ? ` — Score: ${r.technical_score}%` : ' (Not yet analyzed)'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {applyModal.job.requirements && (
                            <div className="mb-5 bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Requirements</p>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-4 leading-relaxed">{applyModal.job.requirements}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setApplyModal(null)}
                                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-semibold transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={confirmApply}
                                disabled={!selectedResume || loadingApply[applyModal.job.id]}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg active:scale-95"
                            >
                                {loadingApply[applyModal.job.id]
                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Sparkles size={14} />
                                }
                                Confirm Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
