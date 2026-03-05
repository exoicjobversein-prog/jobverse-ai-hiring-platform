import { useEffect, useState } from 'react';
import { MapPin, Briefcase, Search, Filter, ChevronDown, Star, X, FileText } from 'lucide-react';
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

    const STATUS_BADGE = { PENDING: 'badge-amber', REVIEWED: 'badge-indigo', SHORTLISTED: 'badge-emerald', REJECTED: 'badge-red', ACCEPTED: 'badge-emerald' };
    const STATUS_LABEL = { PENDING: 'Applied', REVIEWED: 'Under Review', SHORTLISTED: 'Shortlisted', REJECTED: 'Rejected', ACCEPTED: 'Accepted' };

    return (
        <div>
            <div className="mb-6">
                <h1 className="page-title">Job Marketplace</h1>
                <p className="page-subtitle">{filtered.length} position{filtered.length !== 1 ? 's' : ''} available</p>
            </div>

            {/* No resume warning */}
            {resumes.length === 0 && (
                <div className="card border-amber-500/30 bg-amber-500/5 mb-5 flex items-start gap-3">
                    <FileText size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-400">
                        You haven't uploaded a resume yet.{' '}
                        <Link to="/student/resumes" className="text-amber-400 hover:text-amber-300 font-medium underline">
                            Upload one first
                        </Link>{' '}
                        to apply for jobs.
                    </p>
                </div>
            )}

            {/* Search & Filter */}
            <div className="card mb-6">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="input-field pl-9" placeholder="Search jobs, skills, domain…"
                            value={filters.search} onChange={setFilter('search')} />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary">
                        <Filter size={16} />Filters
                        <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                </div>
                {showFilters && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div>
                            <label>Location</label>
                            <input className="input-field" placeholder="e.g. Bangalore" value={filters.location} onChange={setFilter('location')} />
                        </div>
                        <div>
                            <label>Experience</label>
                            <input className="input-field" placeholder="e.g. 2-4 years" value={filters.experience} onChange={setFilter('experience')} />
                        </div>
                        <div>
                            <label>Domain</label>
                            <input className="input-field" placeholder="e.g. Backend" value={filters.domain} onChange={setFilter('domain')} />
                        </div>
                    </div>
                )}
            </div>

            {/* Job cards */}
            {filtered.length === 0 ? (
                <div className="card text-center py-16 text-slate-500">
                    <Briefcase size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-400">No jobs match your filters</p>
                    <button onClick={() => setFilters({ search: '', location: '', experience: '', domain: '' })}
                        className="btn-secondary mt-4 mx-auto">Clear Filters</button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(job => (
                        <div key={job.id} className="card hover:border-indigo-500/40 transition-all duration-200">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="text-white font-bold text-lg">{job.title}</h3>
                                        {job.domain && <span className="badge-indigo">{job.domain}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                                        {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                                        {job.experience && <span className="flex items-center gap-1"><Briefcase size={11} />{job.experience}</span>}
                                        {job.salary && <span className="flex items-center gap-1"><Star size={11} />{job.salary}</span>}
                                        {job.technology_stack && <span>🛠 {job.technology_stack}</span>}
                                    </div>
                                    <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    {applied[job.id] ? (
                                        <span className={`badge ${STATUS_BADGE[applied[job.id]] || 'badge-slate'}`}>
                                            {STATUS_LABEL[applied[job.id]] || applied[job.id]}
                                        </span>
                                    ) : (
                                        <button onClick={() => openApplyModal(job)} disabled={loadingApply[job.id]} className="btn-primary">
                                            {loadingApply[job.id]
                                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                : 'Apply Now'}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-md animate-in">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-bold text-lg">Apply for "{applyModal.job.title}"</h2>
                            <button onClick={() => setApplyModal(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-5">
                            <label>Select Resume to Submit</label>
                            {resumes.length === 0 ? (
                                <p className="text-amber-400 text-sm mt-2">No resumes found. Please upload a resume first.</p>
                            ) : (
                                <select
                                    className="select-field mt-1"
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
                            <div className="mb-5 bg-slate-800/60 rounded-xl p-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Requirements</p>
                                <p className="text-slate-300 text-sm whitespace-pre-wrap line-clamp-4">{applyModal.job.requirements}</p>
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setApplyModal(null)} className="btn-secondary">Cancel</button>
                            <button onClick={confirmApply} disabled={!selectedResume || loadingApply[applyModal.job.id]} className="btn-primary">
                                {loadingApply[applyModal.job.id]
                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : null}
                                Confirm Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
