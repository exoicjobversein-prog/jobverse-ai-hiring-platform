import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Award, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function HRAnalytics() {
    const [apps, setApps] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get('/jobs/applications/'),
            api.get('/interviews/schedules/')
        ]).then(([appRes, schedRes]) => {
            setApps(appRes.data);
            setSchedules(schedRes.data.filter(s => s.status === 'COMPLETED').sort((a, b) => (b.final_score || 0) - (a.final_score || 0)));
        }).catch(() => { });
    }, []);

    const statusCounts = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'].map(s => ({
        name: s.charAt(0) + s.slice(1).toLowerCase(), count: apps.filter(a => a.status === s).length
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Hiring & Interview Analytics</h1>
                <p className="text-gray-600 mt-1">Review AI evaluation reports and pipeline statistics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Applicants', value: apps.length },
                    { label: 'Shortlisted', value: apps.filter(a => a.status === 'SHORTLISTED').length },
                    { label: 'Interviews Completed', value: schedules.length },
                ].map(s => (
                    <div key={s.label} className="card text-center border border-indigo-100 bg-indigo-50/50">
                        <p className="text-4xl font-extrabold text-indigo-700">{s.value}</p>
                        <p className="text-gray-600 text-sm mt-2 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="card lg:col-span-2 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">AI Interview Leaderboard</h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {schedules.length === 0 ? (
                            <p className="text-gray-500 text-sm">No completed interviews yet.</p>
                        ) : (
                            schedules.map((sched, index) => (
                                <div key={sched.id} className="p-4 border rounded-xl bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{sched.candidate_name}</h3>
                                            <p className="text-sm font-medium text-gray-500">{sched.job_title} · {sched.round_type.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <span className="block text-xs text-gray-500 uppercase font-bold tracking-wider">AI Score</span>
                                            <span className={`text-xl font-black ${sched.final_score >= 70 ? 'text-green-600' : sched.final_score >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                {sched.final_score}%
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectedReport(sched)}
                                            className="btn-secondary text-sm flex items-center gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                        >
                                            <FileText size={16} /> View Report
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="card shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Application Pipeline</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusCounts}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 text-white flex justify-between items-start shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedReport.candidate_name}'s AI Report</h2>
                                <p className="text-indigo-100 mt-1">{selectedReport.job_title} | {selectedReport.scheduled_date}</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-lg text-center backdrop-blur-md">
                                <span className="block text-xs uppercase font-bold text-indigo-100">Final Score</span>
                                <span className="text-3xl font-black">{selectedReport.final_score}%</span>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6 bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
                                    <CheckCircle size={20} className="text-green-500" /> Strengths
                                </h3>
                                <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-200">{selectedReport.strengths}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
                                    <AlertCircle size={20} className="text-amber-500" /> Areas for Improvement
                                </h3>
                                <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-200">{selectedReport.weaknesses}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
                                    <Award size={20} className="text-indigo-500" /> AI Recommendation
                                </h3>
                                <div className={`p-4 rounded-lg border font-medium ${selectedReport.recommendation?.toLowerCase().includes('reject') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                                    {selectedReport.recommendation}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-200 flex justify-end shrink-0">
                            <button onClick={() => setSelectedReport(null)} className="btn-secondary bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6">
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
