import { useState, useEffect, useRef } from 'react';
import { Brain, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const CATEGORIES = [
    { key: 'LOGICAL', label: 'Logical Reasoning', icon: '🔍' },
    { key: 'QUANTITATIVE', label: 'Quantitative Aptitude', icon: '📊' },
    { key: 'DATA', label: 'Data Interpretation', icon: '📈' },
];

const TIMER_SECONDS = 30;

export default function AptitudePractice() {
    const [category, setCategory] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [selected, setSelected] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const [done, setDone] = useState(false);
    const [results, setResults] = useState([]);
    const timerRef = useRef(null);

    useEffect(() => {
        if (category) {
            api.get(`/interviews/aptitude/questions/?category=${category}`).then(r => {
                setQuestions(r.data); setCurrent(0); setAnswers([]); setDone(false); setTimer(TIMER_SECONDS);
                if (r.data.length > 0) startTimer();
            }).catch(() => toast.error('Failed to load questions.'));
        }
        return () => clearInterval(timerRef.current);
    }, [category]);

    useEffect(() => {
        if (category && !done) startTimer();
    }, [current]);

    const startTimer = () => {
        clearInterval(timerRef.current);
        setTimer(TIMER_SECONDS);
        timerRef.current = setInterval(() => {
            setTimer(t => {
                if (t <= 1) { clearInterval(timerRef.current); handleNext(null); return 0; }
                return t - 1;
            });
        }, 1000);
    };

    const handleNext = (opt) => {
        clearInterval(timerRef.current);
        const newAns = [...answers, opt];
        setAnswers(newAns);
        setSelected(null);
        if (current + 1 >= questions.length) {
            const score = newAns.filter((a, i) => a === questions[i]?.correct_option).length;
            api.post('/interviews/aptitude/results/', { category, score, total_questions: questions.length, time_taken_seconds: 0 }).catch(() => { });
            setResults(newAns);
            setDone(true);
        } else {
            setCurrent(c => c + 1);
        }
    };

    const optionLabels = ['A', 'B', 'C', 'D'];
    const getOption = (q, l) => q[`option_${l.toLowerCase()}`];
    const optionColor = (opt, q, chosen) => {
        if (!done && chosen !== opt) return 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:bg-slate-700';
        if (opt === q.correct_option) return 'bg-emerald-500/20 border-emerald-500';
        if (chosen === opt && opt !== q.correct_option) return 'bg-red-500/20 border-red-500';
        return 'bg-slate-800 border-slate-700 opacity-50';
    };

    if (!category) return (
        <div>
            <h1 className="page-title">Aptitude Practice</h1>
            <p className="page-subtitle">Test your reasoning and quantitative skills</p>
            <div className="grid grid-cols-3 gap-4 mt-4">
                {CATEGORIES.map(c => (
                    <button key={c.key} onClick={() => setCategory(c.key)} className="card-hover text-left p-6">
                        <div className="text-3xl mb-3">{c.icon}</div>
                        <h3 className="text-white font-bold">{c.label}</h3>
                        <p className="text-slate-400 text-sm mt-1">20 questions · 30s each</p>
                    </button>
                ))}
            </div>
        </div>
    );

    if (done) {
        const score = results.filter((a, i) => a === questions[i]?.correct_option).length;
        return (
            <div className="max-w-2xl">
                <h1 className="page-title">Session Complete!</h1>
                <div className="card mb-6 text-center py-8">
                    <div className="text-5xl font-extrabold text-white mb-2">{score}<span className="text-slate-400 text-2xl">/{questions.length}</span></div>
                    <p className="text-slate-400">Questions correct in {CATEGORIES.find(c => c.key === category)?.label}</p>
                    <div className="score-bar-track mt-4 max-w-sm mx-auto">
                        <div className="score-bar-fill" style={{ width: `${(score / questions.length) * 100}%` }} />
                    </div>
                </div>
                <div className="space-y-3 mb-6">
                    {questions.map((q, i) => (
                        <div key={i} className="card flex items-start gap-3">
                            {results[i] === q.correct_option ? <CheckCircle size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />}
                            <div>
                                <p className="text-slate-200 text-sm font-medium">{q.question_text}</p>
                                <p className="text-xs text-emerald-400 mt-1">Correct: {q.correct_option}) {getOption(q, q.correct_option)}</p>
                                {q.explanation && <p className="text-xs text-slate-400 mt-1">{q.explanation}</p>}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={() => { setCategory(null); setDone(false); }} className="btn-primary">Try Another Category</button>
            </div>
        );
    }

    const q = questions[current];
    if (!q) return <div className="text-slate-400 p-10 text-center">Loading questions…</div>;

    return (
        <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">{CATEGORIES.find(c => c.key === category)?.label}</h1>
                    <p className="page-subtitle">Question {current + 1} of {questions.length}</p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${timer <= 10 ? 'text-red-400 bg-red-500/10' : 'text-indigo-300 bg-indigo-500/10'}`}>
                    <Clock size={18} />{timer}s
                </div>
            </div>
            <div className="score-bar-track mb-6">
                <div className="score-bar-fill bg-indigo-500" style={{ width: `${((current) / questions.length) * 100}%` }} />
            </div>
            <div className="card mb-4">
                <p className="text-white font-semibold text-base">{q.question_text}</p>
                <span className={`badge mt-2 ${q.difficulty === 'HARD' ? 'badge-red' : q.difficulty === 'MEDIUM' ? 'badge-amber' : 'badge-emerald'}`}>{q.difficulty}</span>
            </div>
            <div className="space-y-3 mb-6">
                {optionLabels.map(l => (
                    <button key={l} onClick={() => setSelected(l)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${selected === l ? 'bg-indigo-600/30 border-indigo-400' : 'bg-slate-800 border-slate-700 hover:border-indigo-400/50'}`}>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${selected === l ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>{l}</span>
                        <span className="text-slate-200 text-sm">{getOption(q, l)}</span>
                    </button>
                ))}
            </div>
            <button onClick={() => handleNext(selected)} disabled={!selected} className="btn-primary w-full justify-center py-3">
                {current + 1 < questions.length ? <><ChevronRight size={16} />Next Question</> : <><CheckCircle size={16} />Finish Test</>}
            </button>
        </div>
    );
}
