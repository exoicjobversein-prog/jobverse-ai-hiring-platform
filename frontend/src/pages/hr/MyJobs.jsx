import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Clock, Users, Edit, Trash2, X, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function MyJobs() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState(null);

    // Fetch jobs created by the HR
    const fetchJobs = async () => {
        try {
            const res = await api.get('/jobs/jobs/my-jobs/');
            setJobs(res.data.results || res.data); // Handle both paginated and regular responses
        } catch (err) {
            toast.error('Failed to load your jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this job posting? This cannot be undone.")) return;

        try {
            await api.delete(`/jobs/jobs/${id}/`);
            setJobs(prev => prev.filter(j => j.id !== id));
            toast.success("Job posting deleted.");
        } catch (err) {
            toast.error("Failed to delete job.");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/jobs/jobs/${editModal.id}/`, editModal);
            setJobs(prev => prev.map(j => j.id === editModal.id ? res.data : j));
            setEditModal(null);
            toast.success("Job updated successfully.");
        } catch (err) {
            toast.error("Failed to update job.");
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">My Job Postings</h1>
                    <p className="text-slate-400">Manage jobs you have posted and review their applicants.</p>
                </div>
                <button onClick={() => navigate('/hr/jobs/new')} className="btn-primary flex items-center gap-2">
                    <Briefcase size={16} /> Post New Job
                </button>
            </div>

            {jobs.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase size={24} className="text-slate-500" />
                    </div>
                    <h2 className="text-lg font-bold text-white mb-2">No Jobs Posted</h2>
                    <p className="text-slate-400 mb-6">You haven't posted any jobs yet.</p>
                    <button onClick={() => navigate('/hr/jobs/new')} className="btn-primary">Post Your First Job</button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {jobs.map(job => (
                        <div key={job.id} className="card p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between border-l-4 border-l-indigo-500">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-xl font-bold text-white">{job.title}</h2>
                                    <span className="badge badge-emerald">{job.job_type?.replace('_', ' ') || 'Full Time'}</span>
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-3">
                                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location || 'Remote'}</span>
                                    <span className="flex items-center gap-1.5"><DollarSign size={14} /> {job.salary_range || 'Not specified'}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-slate-300 text-sm line-clamp-2">
                                    {job.description}
                                </div>
                            </div>

                            <div className="flex flex-row md:flex-col gap-3 min-w-[200px]">
                                <button
                                    onClick={() => navigate(`/hr/applications?jobId=${job.id}`)}
                                    className="btn-primary w-full justify-center shadow-lg shadow-indigo-500/20"
                                >
                                    <Users size={16} className="mr-2" /> View Applicants
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditModal(job)}
                                        className="btn-secondary flex-1 justify-center bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white"
                                    >
                                        <Edit size={14} className="mr-1.5" /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(job.id)}
                                        className="btn-secondary flex-1 justify-center text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30"
                                    >
                                        <Trash2 size={14} className="mr-1.5" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-10">
                    <div className="card w-full max-w-2xl bg-slate-900 border border-slate-700 shadow-2xl mt-auto mb-auto">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Edit size={20} className="text-indigo-400" /> Edit Job Posting
                            </h2>
                            <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                                <input type="text" required className="input-field bg-slate-950 border-slate-800" value={editModal.title} onChange={e => setEditModal({ ...editModal, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Location</label>
                                    <input type="text" className="input-field bg-slate-950 border-slate-800" value={editModal.location} onChange={e => setEditModal({ ...editModal, location: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Salary Range</label>
                                    <input type="text" className="input-field bg-slate-950 border-slate-800" value={editModal.salary_range} onChange={e => setEditModal({ ...editModal, salary_range: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Job Type</label>
                                <select className="input-field bg-slate-950 border-slate-800" value={editModal.job_type} onChange={e => setEditModal({ ...editModal, job_type: e.target.value })}>
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CONTRACT">Contract</option>
                                    <option value="INTERNSHIP">Internship</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                                <textarea required rows="4" className="input-field bg-slate-950 border-slate-800 resize-y" value={editModal.description} onChange={e => setEditModal({ ...editModal, description: e.target.value })}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Requirements</label>
                                <textarea required rows="4" className="input-field bg-slate-950 border-slate-800 resize-y" value={editModal.requirements} onChange={e => setEditModal({ ...editModal, requirements: e.target.value })}></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                                <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <CheckCircle size={16} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
