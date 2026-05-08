import { useEffect, useState } from 'react';
import { Search, Mail, Phone, ExternalLink, User, GraduationCap, MapPin } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/users/placement/students/')
            .then(res => setStudents(res.data))
            .catch(() => toast.error('Failed to load students.'))
            .finally(() => setLoading(false));
    }, []);

    const filteredStudents = students.filter(s => 
        s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-white">Student Management</h1>
                    <p className="text-slate-400 text-sm mt-1">View and manage all registered students from your college.</p>
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative max-w-sm w-full">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="input-field !pl-9 !py-2"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-slate-400 font-medium">
                        Showing <span className="text-white">{filteredStudents.length}</span> students
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            {searchTerm ? 'No students found matching your search.' : 'No students registered from your college yet.'}
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Student Name</th>
                                    <th className="px-6 py-4 font-semibold">Contact Details</th>
                                    <th className="px-6 py-4 font-semibold">Profile Details</th>
                                    <th className="px-6 py-4 font-semibold text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-sm">
                                {filteredStudents.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {s.profile_photo_url ? (
                                                    <img src={s.profile_photo_url} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                                                        {(s.first_name || s.username)[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}` : s.username}
                                                    </div>
                                                    <div className="text-xs text-slate-500">@{s.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <Mail size={13} className="text-slate-500" />
                                                    <a href={`mailto:${s.email}`} className="hover:text-indigo-400">{s.email || '—'}</a>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <MapPin size={13} className="text-slate-500" />
                                                    <span>{s.location || '—'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    <GraduationCap size={13} className="text-slate-500" />
                                                    <span className="truncate max-w-[200px]" title={s.education}>{s.education || '—'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => toast('Detailed view coming soon', { icon: '🚧' })}
                                                className="btn-secondary px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                                            >
                                                <ExternalLink size={14} /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
