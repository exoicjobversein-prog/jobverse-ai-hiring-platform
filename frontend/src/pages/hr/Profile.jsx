import { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function HRProfile({ user, setUser }) {
    const [profile, setProfile] = useState(user || {});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const set = (field) => (e) => setProfile(p => ({ ...p, [field]: e.target.value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data } = await api.patch('/users/profile/', {
                first_name: profile.first_name,
                last_name: profile.last_name,
                company_name: profile.company_name,
                headline: profile.headline,
                location: profile.location,
                linkedin_url: profile.linkedin_url,
            });
            const updated = { ...user, ...data };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Profile updated!');
            setEditing(false);
        } catch {
            toast.error('Update failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">HR Profile</h1>
                    <p className="page-subtitle">Your recruiter profile</p>
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
                        <button onClick={() => setEditing(true)} className="btn-secondary"><Edit3 size={16} />Edit</button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {/* Avatar + Name */}
                <div className="card flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {(profile.first_name || profile.username || 'H')[0].toUpperCase()}
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
                    </div>
                </div>

                {/* Company details */}
                <div className="card space-y-4">
                    <div>
                        <label>Company / Organization</label>
                        {editing
                            ? <input className="input-field" value={profile.company_name || ''} onChange={set('company_name')} placeholder="TechCorp Ltd." />
                            : <p className="text-slate-300 text-sm mt-1">{profile.company_name || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>Designation / Headline</label>
                        {editing
                            ? <input className="input-field" value={profile.headline || ''} onChange={set('headline')} placeholder="Senior Technical Recruiter" />
                            : <p className="text-slate-300 text-sm mt-1">{profile.headline || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>Location</label>
                        {editing
                            ? <input className="input-field" value={profile.location || ''} onChange={set('location')} placeholder="Mumbai, India" />
                            : <p className="text-slate-300 text-sm mt-1">{profile.location || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                    <div>
                        <label>LinkedIn URL</label>
                        {editing
                            ? <input className="input-field" type="url" value={profile.linkedin_url || ''} onChange={set('linkedin_url')} placeholder="https://linkedin.com/in/..." />
                            : <p className="text-slate-300 text-sm mt-1 truncate">{profile.linkedin_url || <span className="text-slate-500 italic">Not set</span>}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
