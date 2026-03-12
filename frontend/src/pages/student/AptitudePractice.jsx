import { useState, useEffect, useRef } from 'react';
import { Brain, Clock, CheckCircle, XCircle, ChevronRight, Activity, TrendingUp, Edit3, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TIMER_SECONDS = 40 * 60; // 40 minutes for the full test

const getCategoryLabel = (cat) => {
    const map = {
        'APTITUDE': 'Quantitative Aptitude',
        'LOGICAL': 'Logical Reasoning',
        'COMMUNICATION': 'Communication Skills',
        'DOMAIN': 'Domain-Based Tech',
    };
    return map[cat] || cat;
};

export default function AptitudePractice() {
    const [status, setStatus] = useState('LANDING'); // LANDING, PLAYING, RESULTS
    const [selectedCategory, setSelectedCategory] = useState('FULL_TEST');
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState([]); // [{question_id: 1, selected: 'A'}]
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const [results, setResults] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const startTest = async () => {
        try {
            const endpoint = selectedCategory === 'FULL_TEST'
                ? '/interviews/aptitude/questions/full_test/'
                : `/interviews/aptitude/questions/?category=${selectedCategory}`;

            const res = await api.get(endpoint);
            if (res.data.length === 0) {
                toast.error("No questions found in database.");
                return;
            }

            const testTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60; // 40 mins for full, 10 mins for single category

            setQuestions(res.data);
            setCurrent(0);
            setAnswers([]);
            setStatus('PLAYING');
            setTimer(testTime);

            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimer(t => {
                    if (t <= 1) {
                        clearInterval(timerRef.current);
                        submitTest(answers, 0, testTime);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } catch (error) {
            toast.error("Failed to load test session.");
        }
    };

    const submitTest = async (finalAnswers, timeRemaining, totalTime) => {
        clearInterval(timerRef.current);
        const timeTaken = (totalTime || (selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60)) - timeRemaining;

        try {
            const res = await api.post('/interviews/aptitude/results/evaluate_test/', {
                category: selectedCategory,
                answers: finalAnswers,
                time_taken_seconds: timeTaken
            });
            setResults(res.data);
            setStatus('RESULTS');
        } catch (error) {
            toast.error("Failed to submit test.");
        }
    };

    const handleNext = (selectedOption) => {
        const qId = questions[current].id;
        const newAns = [...answers, { question_id: qId, selected: selectedOption }];
        setAnswers(newAns);

        if (current + 1 >= questions.length) {
            const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
            submitTest(newAns, timer, totalTime);
        } else {
            setCurrent(c => c + 1);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const optionLabels = ['A', 'B', 'C', 'D'];
    const getOptionText = (q, l) => q[`option_${l.toLowerCase()}`];

    if (status === 'LANDING') {
        const testOptions = [
            { key: 'FULL_TEST', label: 'Full Readiness Test', icon: <Brain size={24} />, desc: '80 Questions · 40 Mins', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500' },
            { key: 'APTITUDE', label: 'Quantitative Aptitude', icon: <TrendingUp size={24} />, desc: '20 Questions · 10 Mins', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500' },
            { key: 'LOGICAL', label: 'Logical Reasoning', icon: <Activity size={24} />, desc: '20 Questions · 10 Mins', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500' },
            { key: 'COMMUNICATION', label: 'Communication Skills', icon: <Edit3 size={24} />, desc: '20 Questions · 10 Mins', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500' },
            { key: 'DOMAIN', label: 'Domain-Based Tech', icon: <Target size={24} />, desc: '20 Questions · 10 Mins', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500' },
        ];

        return (
            <div className="max-w-4xl mx-auto text-center py-10">
                <div className="bg-indigo-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain size={36} className="text-indigo-400" />
                </div>
                <h1 className="text-4xl font-black text-white mb-4">Aptitude & Readiness Practice</h1>
                <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
                    Choose to take a comprehensive 80-question assessment or practice specific domains individually to prepare for top placements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 text-left">
                    {testOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setSelectedCategory(opt.key)}
                            className={`p-6 rounded-2xl border-2 transition-all duration-300 ${selectedCategory === opt.key
                                ? `${opt.border} ${opt.bg} transform scale-105 shadow-xl`
                                : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                                }`}
                        >
                            <div className={`${opt.color} mb-3`}>{opt.icon}</div>
                            <h4 className="text-white font-bold text-lg">{opt.label}</h4>
                            <p className="text-sm text-slate-400 mt-1">{opt.desc}</p>
                        </button>
                    ))}
                </div>

                <button onClick={startTest} className="btn-primary text-xl px-14 py-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all font-bold">
                    Start {selectedCategory === 'FULL_TEST' ? 'Full Assessment' : 'Practice Test'}
                </button>
            </div>
        );
    }

    if (status === 'RESULTS' && results) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="page-title text-center mb-8">Performance Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card col-span-1 text-center py-10 bg-gradient-to-br border-indigo-500/30">
                        <div className="inline-flex relative mb-4">
                            <svg className="w-32 h-32 transform -rotate-90">
                                <circle cx="64" cy="64" r="60" className="stroke-slate-700 w-full h-full fill-transparent" strokeWidth="8"></circle>
                                <circle cx="64" cy="64" r="60" className="stroke-indigo-500 w-full h-full fill-transparent" strokeWidth="8"
                                    strokeDasharray={377} strokeDashoffset={377 - (377 * (results.score / results.total_questions))}></circle>
                            </svg>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                <span className="text-4xl font-black text-white">{results.score}</span>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">Total Score</h3>
                        <p className="text-slate-400">Out of {results.total_questions} questions</p>
                    </div>

                    <div className="card col-span-2">
                        <h3 className="text-lg font-bold text-white mb-6">Domain Breakdown</h3>
                        <div className="space-y-5">
                            {Object.entries(results.domain_scores || {}).map(([dom, data]) => (
                                <div key={dom}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-slate-200">{getCategoryLabel(dom)}</span>
                                        <span className="text-slate-400">{data.score} / {data.total}</span>
                                    </div>
                                    <div className="score-bar-track h-2.5">
                                        <div className={`score-bar-fill h-2.5 ${data.score / data.total > 0.7 ? 'bg-emerald-500' : data.score / data.total > 0.4 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${(data.score / data.total) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-xl text-white mb-4 mt-12">Detailed Paper Review</h3>
                <div className="space-y-4">
                    {results.detailed_responses?.map((r, i) => (
                        <div key={i} className={`card border-l-4 ${r.is_correct ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    {r.is_correct ? <CheckCircle className="text-emerald-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                                </div>
                                <div className="w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-slate-200 font-medium leading-relaxed">{i + 1}. {r.question_text}</p>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-md ml-4 whitespace-nowrap">{getCategoryLabel(r.category)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-slate-500 mb-1">Your Answer</p>
                                            <p className={`font-semibold ${r.is_correct ? 'text-emerald-400' : 'text-red-400'}`}>
                                                Option {r.selected || 'Skipped'} {r.selected ? ` - ${r[`option_${r.selected.toLowerCase()}`]}` : ''}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">Correct Answer</p>
                                            <p className="font-semibold text-emerald-400">
                                                Option {r.correct} - {r[`option_${r.correct.toLowerCase()}`]}
                                            </p>
                                        </div>
                                    </div>
                                    {r.explanation && (
                                        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-sm text-slate-300">
                                            <span className="font-bold text-indigo-400 mr-2">Explanation:</span>
                                            {r.explanation}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 text-center">
                    <button onClick={() => setStatus('LANDING')} className="btn-primary">Take Another Test</button>
                </div>
            </div>
        );
    }

    const q = questions[current];
    if (!q) return <div className="text-slate-400 p-10 text-center">Loading test environment…</div>;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
                <div>
                    <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-1 block">
                        {getCategoryLabel(q.category)}
                    </span>
                    <h1 className="text-xl font-bold text-white">Question {current + 1} <span className="text-slate-500 font-normal">/ {questions.length}</span></h1>
                </div>
                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-lg ${timer <= 300 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-indigo-300 bg-indigo-500/10 border border-indigo-500/20'}`}>
                    <Clock size={20} />{formatTime(timer)}
                </div>
            </div>

            <div className="score-bar-track mb-8 h-1 z-0 relative">
                <div className="score-bar-fill bg-gradient-to-r from-indigo-500 to-purple-500 absolute h-full top-0 left-0 transition-all duration-300" style={{ width: `${((current) / questions.length) * 100}%` }} />
            </div>

            <div className="card mb-6 py-8 border-slate-700 bg-slate-800/30">
                <p className="text-white font-semibold text-lg leading-relaxed">{q.question_text}</p>
            </div>

            <div className="space-y-4 mb-8">
                {optionLabels.map(l => (
                    <button key={l} onClick={() => handleNext(l)}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-slate-700 bg-slate-800 hover:border-indigo-500/50 hover:bg-slate-700/50 transition-all text-left group">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 bg-slate-700 text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">{l}</span>
                        <span className="text-slate-200 text-base">{getOptionText(q, l)}</span>
                    </button>
                ))}
            </div>

            <div className="flex justify-between items-center mt-8">
                <button onClick={() => handleNext(null)} className="text-slate-400 hover:text-white font-medium px-4 py-2 transition-colors">
                    Skip Question
                </button>
            </div>
        </div>
    );
}
