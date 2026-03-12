import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Star, AlertCircle, CheckCircle2, XCircle, Search, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StudentResumes() {
    const [resumes, setResumes] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [matching, setMatching] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const fileRef = useRef();

    useEffect(() => { fetchResumes(); }, []);

    const fetchResumes = async () => {
        try {
            const { data } = await api.get('/resumes/');
            setResumes(Array.isArray(data) ? data : (data.results || []));
        } catch (err) {
            console.error('Resume fetch error:', err);
            toast.error('Failed to load resumes.');
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so same file can be re-selected
        e.target.value = '';

        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);

        try {
            await api.post('/resumes/', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success('Resume uploaded! JobVerse AI is analyzing it…');
            fetchResumes();
        } catch (err) {
            console.error('Upload error:', err?.response?.data || err);
            const detail = err?.response?.data
                ? JSON.stringify(err.response.data)
                : 'Upload failed. Please try again.';
            toast.error(detail);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/resumes/${id}/`);
            toast.success('Resume deleted.');
            setResumes(prev => prev.filter(r => r.id !== id));
        } catch {
            toast.error('Delete failed.');
        }
    };

    const handleMatch = async () => {
        if (!jobDescription.trim()) {
            toast.error('Please paste a job description.');
            return;
        }
        setMatching(true);
        try {
            await api.post(`/resumes/${selectedResumeId}/match_job/`, { job_description: jobDescription });
            toast.success('Job Match analysis started! This takes a few seconds...');
            setShowModal(false);
            setJobDescription('');
            setTimeout(fetchResumes, 5000); // Check back in 5s
        } catch (err) {
            console.error('Match error:', err);
            toast.error('Failed to start matching analysis.');
        } finally {
            setMatching(false);
        }
    };

    const openMatchModal = (id) => {
        setSelectedResumeId(id);
        setShowModal(true);
    };

    const scoreColor = (s) =>
        s >= 75 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-red-500';
    
    const scoreColorBg = (s) =>
        s >= 75 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">My Resumes</h1>
                    <p className="page-subtitle">Upload resumes for AI scoring and job applications</p>
                </div>
                <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="btn-primary"
                >
                    {uploading
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Upload size={16} />}
                    {uploading ? 'Uploading…' : 'Upload Resume'}
                </button>
                {/* Hidden file input — accepts PDF and Word docs */}
                <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleUpload}
                />
            </div>

            {/* Info banner */}
            <div className="card border-indigo-500/30 bg-indigo-500/5 mb-5 flex items-start gap-3">
                <AlertCircle size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-400">
                    After uploading, the <span className="text-indigo-300 font-medium">JobVerse AI Engine</span> will
                    automatically score your resume and extract skills. This may take a few seconds.
                </p>
            </div>

            {resumes.length === 0 ? (
                <div className="card text-center py-16 text-slate-500">
                    <FileText size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-400">No resumes uploaded yet</p>
                    <p className="text-sm mt-1 mb-5">Upload your first resume to get AI-powered insights</p>
                    <button onClick={() => fileRef.current?.click()} className="btn-primary mx-auto">
                        <Upload size={16} /> Upload Resume
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {resumes.map(r => (
                        <div key={r.id} className="card flex items-start gap-5">
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <FileText size={22} className="text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">
                                    {r.file?.split('/').pop() || `Resume #${r.id}`}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Uploaded {new Date(r.uploaded_at).toLocaleDateString()}
                                </p>

                                {r.is_processed ? (
                                    <div className="mt-4 flex gap-6 w-full">
                                        {/* Circular Progress */}
                                        <div className="shrink-0 flex flex-col items-center justify-center">
                                            <div className="relative w-24 h-24 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                    <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                    <path className={`${scoreColor(r.final_ats_score ?? 0)}`} strokeDasharray={`${r.final_ats_score ?? 0}, 100`} strokeWidth="3" stroke="currentColor" fill="none"
                                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <span className="text-2xl font-bold text-white">{r.final_ats_score ?? 0}</span>
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400 mt-2 font-medium">ATS Score</span>
                                        </div>

                                        <div className="flex-1 min-w-0 pr-4">
                                            {r.skills?.length > 0 && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Skills Found</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {r.skills.slice(0, 8).map(s => (
                                                            <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{s}</span>
                                                        ))}
                                                        {r.skills.length > 8 && (
                                                            <span className="px-2 py-0.5 rounded-md text-xs bg-slate-800 text-slate-400">+{r.skills.length - 8} more</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {r.job_match_score !== null && (
                                                <div className="mb-4 p-3 rounded-lg bg-indigo-900/20 border border-indigo-500/30">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Target size={14} className="text-indigo-400" />
                                                        <span className="text-sm font-semibold text-white">Job Match: {r.job_match_score}%</span>
                                                    </div>
                                                    {r.missing_skills?.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-slate-400 mb-1">Missing Keywords:</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {r.missing_skills.map(s => (
                                                                    <span key={s} className="px-2 py-0.5 rounded-md text-xs bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid md:grid-cols-2 gap-4">
                                                {r.strengths?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1"><CheckCircle2 size={12}/> Strengths</p>
                                                        <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-emerald-500/50">
                                                            {r.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {r.suggestions?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1"><AlertCircle size={12}/> Suggestions</p>
                                                        <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-amber-500/50">
                                                            {r.suggestions.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                                                <button onClick={() => fetchResumes()} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">Refresh Analysis</button>
                                                <button onClick={() => openMatchModal(r.id)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium flex items-center gap-1"><Target size={12}/> Compare with Job Description</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-3 text-amber-400/80">
                                        <div className="w-3 h-3 border-2 border-amber-400/50 border-t-amber-400 rounded-full animate-spin" />
                                        <span className="text-sm font-medium">JobVerse AI is analyzing your resume...</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => handleDelete(r.id)}
                                className="text-slate-500 hover:text-red-400 transition-colors p-2 flex-shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Match Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-5 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Compare with Job Description</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><XCircle size={20}/></button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-slate-400 mb-3">Paste the job description below to see how well this resume matches and identify missing keywords.</p>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste job description here..."
                                className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                                <button onClick={handleMatch} disabled={matching} className="btn-primary">
                                    {matching ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
                                    ) : (
                                        <><Search size={16} /> Analyze Match</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
