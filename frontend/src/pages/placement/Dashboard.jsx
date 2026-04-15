import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, Users, ClipboardList, Clock, Building2,
    ShieldCheck, Phone, Mail, MapPin, GraduationCap,
    TrendingUp, AlertTriangle
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PlacementDashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        // Gate: unverified users see the pending screen
        if (!user.is_verified) {
            navigate('/placement/pending', { replace: true });
            return;
        }
        api.get('/users/placement-profile/')
            .then(res => setProfile(res.data))
            .catch(() => toast.error('Failed to load placement profile.'))
            .finally(() => setLoadingProfile(false));
    }, [user, navigate]);

    if (!user?.is_verified) return null;

    const stats = [
        { label: 'Jobs Posted', value: '—', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Student Profiles Viewed', value: '—', icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Candidates Shortlisted', value: '—', icon: ClipboardList, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Placement Rate', value: '—', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <Building2 size={22} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">
                            Welcome, {user?.first_name || user?.username}!
                        </h1>
                        {profile && (
                            <p className="text-slate-400 text-sm mt-1">
                                {profile.college_name}
                                {profile.college_location && ` · ${profile.college_location}`}
                            </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                            <ShieldCheck size={13} className="text-emerald-400" />
                            <span className="text-xs text-emerald-400 font-medium">Verified Placement Admin</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={18} className={color} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{value}</p>
                            <p className="text-xs text-slate-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Post a Job', desc: 'Create a new placement drive or job opening', icon: Briefcase, color: 'indigo', to: '/placement/jobs/new' },
                    { label: 'Student Profiles', desc: 'Browse and search eligible student profiles', icon: Users, color: 'violet', to: '/placement/students' },
                    { label: 'Shortlist', desc: 'Manage shortlisted candidates for your drives', icon: ClipboardList, color: 'emerald', to: '/placement/shortlist' },
                ].map(item => (
                    <button
                        key={item.label}
                        onClick={() => toast('Coming soon — under development', { icon: '🚧' })}
                        className="card text-left hover:border-indigo-500/50 transition-all duration-200 group"
                    >
                        <div className={`w-9 h-9 rounded-lg bg-${item.color}-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                            <item.icon size={16} className={`text-${item.color}-400`} />
                        </div>
                        <p className="text-sm font-semibold text-white">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </button>
                ))}
            </div>

            {/* Profile details */}
            {!loadingProfile && profile && (
                <div className="card">
                    <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Your Placement Profile</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {[
                            { label: 'College', value: profile.college_name, icon: Building2 },
                            { label: 'College Email', value: profile.college_email, icon: Mail },
                            { label: 'Location', value: profile.college_location || '—', icon: MapPin },
                            { label: 'Affiliation', value: profile.university_affiliation || '—', icon: GraduationCap },
                            { label: 'Officer', value: profile.officer_full_name, icon: Users },
                            { label: 'Designation', value: profile.officer_designation || '—', icon: ShieldCheck },
                            { label: 'Contact', value: profile.officer_contact, icon: Phone },
                            { label: 'Status', value: profile.verification_status, icon: Clock },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50">
                                <Icon size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <p className="text-slate-200 font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
