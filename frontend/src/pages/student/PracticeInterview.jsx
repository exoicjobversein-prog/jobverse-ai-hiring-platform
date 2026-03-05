import { useState, useEffect, useRef } from 'react';
import { Bot, Send, Square, RefreshCw, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PracticeInterview() {
    const [sessions, setSessions] = useState([]);
    const [active, setActive] = useState(null);
    const [topic, setTopic] = useState('General Full-Stack Development');
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [polling, setPolling] = useState(false);
    const pollRef = useRef(null);

    useEffect(() => {
        api.get('/interviews/practice/').then(r => setSessions(r.data)).catch(() => { });
        return () => clearInterval(pollRef.current);
    }, []);

    const startSession = async () => {
        setStarting(true);
        try {
            const { data } = await api.post('/interviews/practice/', { topic });
            setActive(data);
            toast.success('JobVerse AI Interview Engine is generating your first question…');
            // Poll for question to appear
            pollRef.current = setInterval(async () => {
                try {
                    const r = await api.get(`/interviews/practice/${data.id}/`);
                    setActive(r.data);
                    const firstQ = r.data.conversation_history?.find(h => h.question && !h.answer);
                    if (firstQ) clearInterval(pollRef.current);
                } catch { }
            }, 2000);
        } catch { toast.error('Failed to start session.'); } finally { setStarting(false); }
    };

    const submitAnswer = async () => {
        if (!answer.trim() || !active) return;
        const currentQ = active.conversation_history?.findLast(h => h.question && !h.answer)?.question;
        if (!currentQ) { toast.error('No question to answer.'); return; }
        setSubmitting(true);
        try {
            await api.post(`/interviews/practice/${active.id}/submit-answer/`, { question_text: currentQ, answer });
            setAnswer('');
            toast.success('JobVerse AI Interview Engine is analyzing your response and generating the next technical challenge.');
            pollRef.current = setInterval(async () => {
                try {
                    const r = await api.get(`/interviews/practice/${active.id}/`);
                    setActive(r.data);
                    clearInterval(pollRef.current);
                } catch { }
            }, 2500);
        } catch { toast.error('Submission failed.'); } finally { setSubmitting(false); }
    };

    const endSession = async () => {
        if (!active) return;
        await api.post(`/interviews/practice/${active.id}/end/`);
        toast.success('Practice session completed!');
        const r = await api.get('/interviews/practice/');
        setSessions(r.data); setActive(null);
    };

    const pendingQ = active?.conversation_history?.findLast(h => h.question);

    if (active) return (
        <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="page-title">Practice AI Interview</h1>
                    <p className="page-subtitle">Topic: {active.topic}</p>
                </div>
                <button onClick={endSession} className="btn-danger"><Square size={16} />End Session</button>
            </div>

            {/* Q&A History */}
            <div className="space-y-4 mb-5">
                {(active.conversation_history || []).filter(h => h.question).map((h, i) => (
                    <div key={i} className="space-y-3">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot size={16} className="text-indigo-400" />
                            </div>
                            <div className="card flex-1 bg-slate-800/60">
                                <p className="text-slate-200 text-sm">{h.question}</p>
                            </div>
                        </div>
                        {h.answer && (
                            <div className="flex gap-3 justify-end">
                                <div className="card flex-1 bg-indigo-900/30 border-indigo-500/30">
                                    <p className="text-slate-200 text-sm">{h.answer}</p>
                                    {h.score !== null && h.score !== undefined && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-indigo-500/20">
                                            <Star size={12} className="text-amber-400" />
                                            <span className="text-xs text-amber-400 font-semibold">Score: {h.score}/10</span>
                                        </div>
                                    )}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-white text-xs font-bold">U</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Answer input */}
            <div className="card border-indigo-500/30">
                <label className="mb-2">Your Answer</label>
                <textarea className="input-field min-h-[120px] resize-y mb-3" value={answer}
                    onChange={e => setAnswer(e.target.value)} placeholder="Type your technical answer here…" />
                <div className="flex justify-end">
                    <button onClick={submitAnswer} disabled={submitting || !answer.trim()} className="btn-primary">
                        {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={16} />}
                        Submit Answer
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div>
            <h1 className="page-title">Practice AI Interview</h1>
            <p className="page-subtitle">Simulate real technical interviews powered by JobVerse AI</p>

            <div className="card max-w-xl mb-8">
                <h2 className="section-title">Start New Session</h2>
                <div className="mb-4">
                    <label>Interview Topic</label>
                    <input className="input-field" value={topic} onChange={e => setTopic(e.target.value)}
                        placeholder="e.g. Python Backend Development, System Design…" />
                </div>
                <button onClick={startSession} disabled={starting} className="btn-primary">
                    {starting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Bot size={16} />}
                    Start Practice Interview
                </button>
            </div>

            {sessions.length > 0 && (
                <div>
                    <h2 className="section-title">Past Sessions</h2>
                    <div className="grid gap-3">
                        {sessions.map(s => (
                            <div key={s.id} className="card flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-white">{s.topic}</p>
                                    <p className="text-xs text-slate-400">{new Date(s.started_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {s.final_score != null && <span className="badge-emerald">Score: {s.final_score}%</span>}
                                    <span className={s.is_completed ? 'badge-slate' : 'badge-amber'}>{s.is_completed ? 'Completed' : 'In Progress'}</span>
                                    {!s.is_completed && (
                                        <button onClick={() => setActive(s)} className="btn-secondary text-xs"><RefreshCw size={13} />Resume</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
