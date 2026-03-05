import { useState } from 'react';
import { Briefcase, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PostJob() {
    const [form, setForm] = useState({
        title: '', description: '', requirements: '', experience: '',
        location: '', salary: '', domain: '', technology_stack: ''
    });
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/jobs/jobs/', form);
            toast.success('Job posted successfully!');
            navigate('/hr/applications');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to post job.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <Briefcase size={20} className="text-indigo-400" />
                </div>
                <div>
                    <h1 className="page-title mb-0">Post a New Job</h1>
                    <p className="page-subtitle">AI will screen and score incoming candidates</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-4">
                <div>
                    <label>Job Title <span className="text-red-400">*</span></label>
                    <input className="input-field" value={form.title} onChange={set('title')} placeholder="e.g. Senior Python Developer" required />
                </div>

                <div>
                    <label>Description <span className="text-red-400">*</span></label>
                    <textarea className="input-field min-h-[100px] resize-y" value={form.description} onChange={set('description')} placeholder="Describe the role and responsibilities…" required />
                </div>

                <div>
                    <label>Requirements <span className="text-red-400">*</span></label>
                    <textarea className="input-field min-h-[100px] resize-y" value={form.requirements} onChange={set('requirements')} placeholder="List technical requirements the AI will use to screen resumes…" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label>Experience Required</label>
                        <input className="input-field" value={form.experience} onChange={set('experience')} placeholder="e.g. 2–4 years" />
                    </div>
                    <div>
                        <label>Location</label>
                        <input className="input-field" value={form.location} onChange={set('location')} placeholder="e.g. Bangalore / Remote" />
                    </div>
                    <div>
                        <label>Salary Range</label>
                        <input className="input-field" value={form.salary} onChange={set('salary')} placeholder="e.g. ₹12–18 LPA" />
                    </div>
                    <div>
                        <label>Domain</label>
                        <input className="input-field" value={form.domain} onChange={set('domain')} placeholder="e.g. Backend, AI/ML" />
                    </div>
                </div>

                <div>
                    <label>Technology Stack</label>
                    <input className="input-field" value={form.technology_stack} onChange={set('technology_stack')} placeholder="e.g. Python, Django, PostgreSQL, Redis" />
                </div>

                <div className="pt-2">
                    <button type="submit" disabled={saving} className="btn-primary">
                        {saving
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Plus size={16} />}
                        Post Job
                    </button>
                </div>
            </form>
        </div>
    );
}
