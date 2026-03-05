import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Trash2, Star, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StudentResumes() {
    const [resumes, setResumes] = useState([]);
    const [uploading, setUploading] = useState(false);
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

    const scoreColor = (s) =>
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
                                    <div className="mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Star size={12} className="text-amber-400" />
                                            <span className="text-xs font-semibold text-white">
                                                AI Score: {r.technical_score ?? 0}%
                                            </span>
                                        </div>
                                        <div className="score-bar-track">
                                            <div
                                                className={`score-bar-fill ${scoreColor(r.technical_score ?? 0)}`}
                                                style={{ width: `${r.technical_score ?? 0}%` }}
                                            />
                                        </div>
                                        {r.skills?.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {r.skills.slice(0, 6).map(s => (
                                                    <span key={s} className="badge-indigo">{s}</span>
                                                ))}
                                                {r.skills.length > 6 && (
                                                    <span className="badge-slate">+{r.skills.length - 6} more</span>
                                                )}
                                            </div>
                                        )}
                                        {r.summary && (
                                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{r.summary}</p>
                                        )}
                                    </div>
                                ) : (
                                    <span className="badge-amber mt-2 inline-flex">
                                        JobVerse AI is analyzing…
                                    </span>
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
        </div>
    );
}
