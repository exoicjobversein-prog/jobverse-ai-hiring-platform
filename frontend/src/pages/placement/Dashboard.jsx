import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Building2, ShieldCheck, TrendingUp, CheckCircle, Calendar,
    MapPin, Mail, GraduationCap, Phone
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function PlacementDashboard({ user }) {
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        api.get('/users/placement-profile/')
            .then(res => setProfile(res.data))
            .catch(() => toast.error('Failed to load placement profile.'))
            .finally(() => setLoadingProfile(false));
    }, [user, navigate]);

    const overviewStats = [
        { label: 'Total Students', value: '1,250', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Placed Students', value: '842', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Placement Rate', value: '67.3%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Active Companies', value: '45', icon: Building2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Upcoming Drives', value: '12', icon: Calendar, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Welcome banner */}
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                        <Building2 size={22} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white">
                            Placement Command Center
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            {profile?.college_name || 'Manage all placement activities from one place'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-xs text-emerald-400 font-medium">Verified Admin Access</span>
                </div>
            </div>

            {/* Dashboard Overview */}
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mt-8 mb-2 px-1">Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {overviewStats.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-200">
                        <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={18} className={color} />
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{value}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Profile Summary */}
                {!loadingProfile && profile && (
                    <div className="card bg-slate-900/50 border border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Building2 size={16} className="text-indigo-400" />
                            Institutional Profile
                        </h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <span className="text-slate-500 flex items-center gap-2"><Users size={14}/> Contact Officer</span>
                                <span className="text-slate-200 font-medium">{profile.officer_full_name || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <span className="text-slate-500 flex items-center gap-2"><Mail size={14}/> College Email</span>
                                <span className="text-slate-200 font-medium">{profile.college_email || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-2"><MapPin size={14}/> Location</span>
                                <span className="text-slate-200 font-medium">{profile.college_location || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
