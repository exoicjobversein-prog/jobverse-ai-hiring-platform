import { useEffect, useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function StudentProfile({ user, setUser }) {
    const [profile, setProfile] = useState(user || {});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => { setProfile(user || {}); }, [user]);

    const set = (field) => (e) => setProfile(p => ({ ...p, [field]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(profile).forEach(([k, v]) => {
                if (v === null || v === undefined || v === '') return;

                if (k === 'skills') {
                    formData.append(k, JSON.stringify(v));
                } else if (k === 'profile_photo') {
                    // Only append profile photo if it's an actual File object, not a string URL
                    if (v instanceof File) {
                        formData.append(k, v);
                    }
                } else if (typeof v === 'string' || typeof v === 'number') {
                    formData.append(k, v);
                }
            });
            const { data } = await api.patch('/users/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updated = { ...user, ...data };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Profile updated successfully!');
            setEditing(false);
        } catch {
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !(profile.skills || []).includes(s)) {
            setProfile(p => ({ ...p, skills: [...(p.skills || []), s] }));
            setSkillInput('');
        }
    };

    const removeSkill = (s) => setProfile(p => ({ ...p, skills: (p.skills || []).filter(x => x !== s) }));

    return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Build your professional identity</p>
                </div>
                <div className="flex gap-2">
                    {editing ? (
                        <>
                            <button onClick={() => setEditing(false)} className="btn-secondary"><X size={16} />Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary">
                                {saving
                                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <Save size={16} />}
                                Save
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="btn-secondary"><Edit3 size={16} />Edit Profile</button>
                    )}
                </div>
            </div>

            <div className="space-y-5">
                {/* Header card */}
                <div className="card flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {(profile.first_name || profile.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                            <label>First Name</label>
                            {editing
                                ? <input className="input-field" value={profile.first_name || ''} onChange={set('first_name')} placeholder="Alex" />
                                : <p className="text-slate-300 text-sm mt-1">{profile.first_name || <span className="text-slate-500 italic">Not set</span>}</p>}
                        </div>
                        <div>
                            <label>Last Name</label>
                            {editing
                                ? <input className="input-field" value={profile.last_name || ''} onChange={set('last_name')} placeholder="Smith" />
                                : <p className="text-slate-300 text-sm mt-1">{profile.last_name || <span className="text-slate-500 italic">Not set</span>}</p>}
                        </div>
                        <div>
                            <label>Headline</label>
                            {editing
                                ? <input className="input-field" value={profile.headline || ''} onChange={set('headline')} placeholder="Full Stack Developer" />
                                : <p className="text-slate-300 text-sm mt-1">{profile.headline || <span className="text-slate-500 italic">Not set</span>}</p>}
                        </div>
                        <div>
                            <label>Location</label>
                            {editing
                                ? <input className="input-field" value={profile.location || ''} onChange={set('location')} placeholder="Bangalore, India" />
                                : <p className="text-slate-300 text-sm mt-1">{profile.location || <span className="text-slate-500 italic">Not set</span>}</p>}
                        </div>
                    </div>
                </div>

                {/* Professional details */}
                <div className="card grid grid-cols-2 gap-4">
                    <div>
                        <label>Years of Experience</label>
                        {editing
                            ? <input className="input-field" type="number" value={profile.years_of_experience || ''} onChange={set('years_of_experience')} />
                            : <p className="text-slate-300 text-sm mt-1">{profile.years_of_experience ?? <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>LinkedIn URL</label>
                        {editing
                            ? <input className="input-field" type="url" value={profile.linkedin_url || ''} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                            : <p className="text-slate-300 text-sm mt-1 truncate">{profile.linkedin_url || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div className="col-span-2">
                        <label>GitHub URL</label>
                        {editing
                            ? <input className="input-field" type="url" value={profile.github_url || ''} onChange={set('github_url')} placeholder="https://github.com/..." />
                            : <p className="text-slate-300 text-sm mt-1 truncate">{profile.github_url || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                </div>

                {/* Skills */}
                <div className="card">
                    <label className="mb-2 block">Skills</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(profile.skills || []).map(s => (
                            <span key={s} className="badge-indigo badge flex items-center gap-1">
                                {s}
                                {editing && (
                                    <X size={10} className="cursor-pointer hover:text-red-300 ml-0.5" onClick={() => removeSkill(s)} />
                                )}
                            </span>
                        ))}
                        {(profile.skills || []).length === 0 && <span className="text-slate-500 text-sm italic">No skills added</span>}
                    </div>
                    {editing && (
                        <div className="flex gap-2">
                            <input
                                className="input-field"
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                placeholder="Add a skill (press Enter)"
                            />
                            <button onClick={addSkill} className="btn-secondary">Add</button>
                        </div>
                    )}
                </div>

                {/* Narrative fields */}
                <div className="card space-y-4">
                    <div>
                        <label>Education</label>
                        {editing
                            ? <textarea className="input-field min-h-[80px] resize-y" value={profile.education || ''} onChange={set('education')} />
                            : <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{profile.education || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>Certifications</label>
                        {editing
                            ? <textarea className="input-field min-h-[80px] resize-y" value={profile.certifications || ''} onChange={set('certifications')} />
                            : <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{profile.certifications || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>Projects</label>
                        {editing
                            ? <textarea className="input-field min-h-[80px] resize-y" value={profile.projects || ''} onChange={set('projects')} />
                            : <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{profile.projects || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
