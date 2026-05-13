import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Brain, Layers, Activity } from 'lucide-react';
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
            <div className="bg-black border border-white/10 rounded-xl p-3 text-sm shadow-2xl">
                <p className="font-bold text-white mb-1">{label}</p>
                <p className="text-indigo-400">{payload[0]?.name}: <span className="font-extrabold text-white">{payload[0]?.value}%</span></p>
            </div>
        );
        return null;
    };

    const avgPractice = practiceData.length
        ? Math.round(practiceData.reduce((a, b) => a + b.score, 0) / practiceData.length)
        : null;
    const avgAptitude = aptitudeData.length
        ? Math.round(aptitudeData.reduce((a, b) => a + b.score, 0) / aptitudeData.length)
        : null;
    const totalSessions = practiceData.length + aptitudeData.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-black border border-white/10 p-7 shadow-2xl">
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-indigo-600/5 blur-3xl pointer-events-none" />
                <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-900/40">
                        <Activity size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight">Performance Analytics</h1>
                        <p className="text-slate-400 text-sm mt-1">Track your growth across interviews and aptitude tests</p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: 'Avg AI Interview Score',
                        value: avgPractice != null ? `${avgPractice}%` : 'N/A',
                        icon: TrendingUp,
                        gradient: 'from-indigo-500 to-blue-600',
                        bg: 'bg-indigo-500/10',
                        border: 'border-indigo-500/20',
                        text: 'text-indigo-400',
                        sub: `${practiceData.length} sessions`
                    },
                    {
                        label: 'Avg Aptitude Score',
                        value: avgAptitude != null ? `${avgAptitude}%` : 'N/A',
                        icon: Brain,
                        gradient: 'from-emerald-500 to-teal-600',
                        bg: 'bg-emerald-500/10',
                        border: 'border-emerald-500/20',
                        text: 'text-emerald-400',
                        sub: `${aptitudeData.length} tests`
                    },
                    {
                        label: 'Total Sessions',
                        value: totalSessions,
                        icon: Layers,
                        gradient: 'from-violet-500 to-purple-600',
                        bg: 'bg-violet-500/10',
                        border: 'border-violet-500/20',
                        text: 'text-violet-400',
                        sub: 'Combined activity'
                    },
                ].map(({ label, value, icon: Icon, bg, border, text, sub }) => (
                    <div key={label} className={`${bg} border ${border} rounded-2xl p-5`}>
                        <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center mb-3`}>
                            <Icon size={18} className={text} />
                        </div>
                        <p className={`text-3xl font-extrabold ${text}`}>{value}</p>
                        <p className="text-slate-200 text-sm font-semibold mt-0.5">{label}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Interview Score Line Chart */}
                <div className="bg-black border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                            <BarChart3 size={16} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">AI Interview Scores</h2>
                            <p className="text-slate-500 text-xs">Your progress over time</p>
                        </div>
                    </div>
                    {practiceData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-slate-600">
                            <TrendingUp size={32} className="mb-3 opacity-40" />
                            <p className="text-sm font-medium text-slate-500">No data yet</p>
                            <p className="text-xs text-slate-600 mt-1">Complete practice interviews to see scores</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={practiceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2.5}
                                    dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#1e1b4b' }}
                                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Aptitude Bar Chart */}
                <div className="bg-black border border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                            <Brain size={16} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-sm">Aptitude Test Scores</h2>
                            <p className="text-slate-500 text-xs">Performance per test</p>
                        </div>
                    </div>
                    {aptitudeData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 text-slate-600">
                            <Brain size={32} className="mb-3 opacity-40" />
                            <p className="text-sm font-medium text-slate-500">No data yet</p>
                            <p className="text-xs text-slate-600 mt-1">Complete aptitude tests to see scores</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={aptitudeData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="score" name="Score" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
