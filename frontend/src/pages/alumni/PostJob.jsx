import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building2, MapPin, Link as LinkIcon, FileText, Send, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PostReferral() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        role: '',
        company: '',
        location: '',
        link: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Mock save delay
        setTimeout(() => {
            toast.success('Job Referral posted successfully!');
            setLoading(false);
            navigate('/alumni/jobs');
        }, 1000);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 cursor-pointer mb-2 transition-colors w-fit" onClick={() => navigate('/alumni/jobs')}>
                        <ArrowLeft size={16} />
                        <span className="text-sm font-medium">Back to Jobs</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Post a Job Referral</h1>
                    <p className="text-slate-400 mt-1">Share open roles at your company and allow students to request referrals.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title / Role</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input required className="input-field w-full pl-9" placeholder="e.g. Frontend Engineer"
                                value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input required className="input-field w-full pl-9" placeholder="e.g. TechCorp Inc."
                                value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input required className="input-field w-full pl-9" placeholder="e.g. Remote / New York"
                                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Official Job Link (URL)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input required type="url" className="input-field w-full pl-9" placeholder="https://careers.company.com/..."
                                value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Internal Notes / Description</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-slate-500" size={16} />
                            <textarea required className="input-field w-full pl-9 h-32 resize-none py-2.5" 
                                placeholder="Any specific requirements? Which team is this for? Do they need to send you their resume first?"
                                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/alumni/jobs')} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary min-w-[140px]">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={18} /> Post Referral
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
