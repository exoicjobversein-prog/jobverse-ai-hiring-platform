import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import api from '../../services/api';

export default function Analytics() {
    const [practiceData, setPracticeData] = useState([]);
    const [aptitudeData, setAptitudeData] = useState([]);

    useEffect(() => {
        api.get('/interviews/practice/').then(r => {
            const data = r.data.filter(s => s.is_completed && s.final_score != null)
                .map((s, i) => ({ name: `Session ${i + 1}`, score: s.final_score, topic: s.topic }));
            setPracticeData(data);
        }).catch(() => { });

        api.get('/interviews/aptitude/results/').then(r => {
            const data = r.data.map((res, i) => ({
                name: `#${i + 1}`, score: Math.round((res.score / (res.total_questions || 1)) * 100),
                category: res.category
            }));
            setAptitudeData(data);
        }).catch(() => { });
    }, []);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) return (
            <div className="card p-3 text-sm">
                <p className="font-semibold text-white">{label}</p>
                <p className="text-indigo-400">{payload[0]?.name}: <span className="font-bold">{payload[0]?.value}%</span></p>
            </div>
        );
        return null;
    };

    return (
        <div>
            <h1 className="page-title">Performance Analytics</h1>
            <p className="page-subtitle">Track your growth over time</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Practice Interviews */}
                <div className="card">
                    <h2 className="section-title flex items-center gap-2"><BarChart3 size={18} className="text-indigo-400" />AI Interview Scores</h2>
                    {practiceData.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">Complete practice interviews to see your score history</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={practiceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Aptitude */}
                <div className="card">
                    <h2 className="section-title flex items-center gap-2"><BarChart3 size={18} className="text-emerald-400" />Aptitude Test Scores</h2>
                    {aptitudeData.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">Complete aptitude tests to see your score history</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={aptitudeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Summary stats */}
            {(practiceData.length > 0 || aptitudeData.length > 0) && (
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {[
                        { label: 'Avg AI Interview Score', value: practiceData.length ? Math.round(practiceData.reduce((a, b) => a + b.score, 0) / practiceData.length) + '%' : 'N/A', color: 'indigo' },
                        { label: 'Avg Aptitude Score', value: aptitudeData.length ? Math.round(aptitudeData.reduce((a, b) => a + b.score, 0) / aptitudeData.length) + '%' : 'N/A', color: 'emerald' },
                        { label: 'Total Sessions', value: practiceData.length + aptitudeData.length, color: 'violet' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <p className="text-2xl font-extrabold text-white">{s.value}</p>
                            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
