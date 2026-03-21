import { useState } from 'react';
import { Users, CheckCircle, XCircle, MessageSquare, Clock, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentRequests() {
    const [requests, setRequests] = useState([
        { id: 1, name: 'Alice Smith', university: 'Tech University', role: 'Software Engineering Student', graduation_year: 2026, status: 'pending', date: '2 hours ago', message: 'Hi! I saw your profile and would love to connect to learn more about your experience at Google.' },
        { id: 2, name: 'Bob Johnson', university: 'State College', role: 'Data Science Student', graduation_year: 2025, status: 'pending', date: '5 hours ago', message: 'I am highly interested in the data analyst role you posted. Can we have a quick chat?' },
        { id: 3, name: 'Charlie Davis', university: 'Global Institute', role: 'Business Administration', graduation_year: 2027, status: 'accepted', date: '1 day ago', message: 'Looking forward to your guidance.' },
    ]);

    const handleAction = (id, action) => {
        setRequests(requests.map(req => {
            if (req.id === id) {
                if (action === 'accept') toast.success(`Accepted request from ${req.name}`);
                if (action === 'reject') toast.error(`Declined request from ${req.name}`);
                return { ...req, status: action === 'accept' ? 'accepted' : 'rejected' };
            }
            return req;
        }));
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const pastRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Student Requests</h1>
                    <p className="text-slate-400 mt-1">Manage connection and mentorship requests from students.</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-lg font-medium border border-indigo-500/20 flex items-center gap-2">
                    <Users size={18} /> {pendingRequests.length} Pending
                </div>
            </div>

            {/* Pending Requests */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white px-1">Awaiting Review</h2>
                
                {pendingRequests.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center bg-stripes">
                        <Users size={32} className="mx-auto text-slate-600 mb-3" />
                        <h3 className="text-slate-300 font-medium">You're all caught up!</h3>
                        <p className="text-slate-500 text-sm mt-1">No pending student requests right now.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pendingRequests.map(req => (
                            <div key={req.id} className="bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors rounded-xl p-5 flex flex-col md:flex-row gap-5">
                                {/* Left: Profile Info */}
                                <div className="flex items-start gap-4 md:w-1/3 flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-indigo-500/20">
                                        {req.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-200">{req.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-indigo-400 mt-0.5 font-medium">
                                            <GraduationCap size={14} /> {req.role}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{req.university} • Class of {req.graduation_year}</p>
                                    </div>
                                </div>
                                
                                {/* Middle: Message */}
                                <div className="flex-1 bg-slate-800/40 rounded-lg p-3 border border-slate-700/50">
                                    <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1.5">
                                        <MessageSquare size={12} /> Message
                                    </h4>
                                    <p className="text-sm text-slate-300 italic">"{req.message}"</p>
                                </div>

                                {/* Right: Actions */}
                                <div className="flex flex-row md:flex-col justify-end gap-2 md:w-32 flex-shrink-0">
                                    <button onClick={() => handleAction(req.id, 'accept')} className="btn-primary flex-1 md:flex-none text-sm py-2">
                                        Accept
                                    </button>
                                    <div className="flex gap-2 flex-1 md:flex-none">
                                        <button onClick={() => toast('Opening chat...')} className="btn-secondary flex-1 py-2 px-0 flex justify-center text-slate-300">
                                            <MessageSquare size={16} />
                                        </button>
                                        <button onClick={() => handleAction(req.id, 'reject')} className="btn-secondary flex-1 py-2 px-0 flex justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300">
                                            <XCircle size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 text-center w-full mt-auto hidden md:block flex items-center justify-center gap-1">
                                        <Clock size={10} /> {req.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Past History */}
            {pastRequests.length > 0 && (
                <div className="pt-6">
                    <h2 className="text-base font-semibold text-slate-400 px-1 mb-4">Past Connections</h2>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        <div className="divide-y divide-slate-800/50">
                            {pastRequests.map(req => (
                                <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-700">
                                            {req.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-slate-300">{req.name}</h3>
                                            <p className="text-xs text-slate-500">{req.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1.5 ${
                                            req.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {req.status === 'accepted' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                        <span className="text-xs text-slate-600 w-20 text-right">{req.date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
