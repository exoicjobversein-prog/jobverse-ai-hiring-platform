import { useEffect, useState } from 'react';
import { CalendarDays, Users, ExternalLink, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Workshops({ user }) {
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/community/workshops/').then(r => setWorkshops(r.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const handleRegister = async (ws) => {
        try {
            if (ws.is_registered) {
                await api.post(`/community/workshops/${ws.id}/unregister/`);
                toast.success('Unregistered from workshop.');
            } else {
                await api.post(`/community/workshops/${ws.id}/register/`);
                toast.success('Registered successfully!');
            }
            const r = await api.get('/community/workshops/');
            setWorkshops(r.data);
        } catch { toast.error('Action failed.'); }
    };

    const upcoming = workshops.filter(w => new Date(w.scheduled_at) > new Date());
    const past = workshops.filter(w => new Date(w.scheduled_at) <= new Date());

    const Card = ({ w }) => (
        <div className="card hover:border-indigo-500/40 transition-all">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{w.title}</h3>
                        {w.category && <span className="badge-indigo">{w.category}</span>}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2">{w.description}</p>
                </div>
                <button onClick={() => handleRegister(w)} className={w.is_registered ? 'btn-secondary' : 'btn-primary'}>
                    {w.is_registered ? <><CheckCircle size={14} />Registered</> : 'Register'}
                </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 pt-3 border-t border-slate-800">
                <span className="flex items-center gap-1"><CalendarDays size={12} />{new Date(w.scheduled_at).toLocaleString()}</span>
                <span className="flex items-center gap-1"><Users size={12} />{w.attendee_count} registered</span>
                <span>By {w.host_name || 'Professional'}</span>
                {w.meeting_link && (
                    <a href={w.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                        <ExternalLink size={12} />Join Link
                    </a>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="text-slate-400 p-10 text-center">Loading workshops…</div>;

    return (
        <div>
            <h1 className="page-title">Live Workshops</h1>
            <p className="page-subtitle">Expert-led sessions to boost your career</p>

            {workshops.length === 0 && (
                <div className="card text-center py-16 text-slate-500">
                    <CalendarDays size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-400">No workshops scheduled yet</p>
                    <p className="text-sm mt-1">Check back soon!</p>
                </div>
            )}

            {upcoming.length > 0 && (
                <div className="mb-8">
                    <h2 className="section-title">Upcoming Sessions</h2>
                    <div className="grid gap-4">{upcoming.map(w => <Card key={w.id} w={w} />)}</div>
                </div>
            )}
            {past.length > 0 && (
                <div>
                    <h2 className="section-title">Past Sessions</h2>
                    <div className="grid gap-4 opacity-70">{past.map(w => <Card key={w.id} w={w} />)}</div>
                </div>
            )}
        </div>
    );
}
