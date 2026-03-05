import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AlertCircle, Clock, Bot, Send, Square, Volume2, Mic } from 'lucide-react';
import toast from 'react-hot-toast';

const MAX_QUESTIONS = 5; // Standard AI Interview length

const InterviewSession = ({ user }) => {
    const { id: scheduleId } = useParams();
    const [searchParams] = useSearchParams();
    const resumeId = searchParams.get('resumeId');
    const navigate = useNavigate();

    const [interviewData, setInterviewData] = useState(null);
    const [currentQuestionText, setCurrentQuestionText] = useState('');
    const [questionCount, setQuestionCount] = useState(1);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Proctoring & Status
    const [timeLeft, setTimeLeft] = useState(300); // 5 mins per question
    const [warnings, setWarnings] = useState([]);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(null);

    const ws = useRef(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            initializeInterview();
            setupWebSocket();
        }

        window.addEventListener('blur', handleBlur);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);

        return () => {
            if (ws.current) ws.current.close();
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            window.speechSynthesis?.cancel(); // Stop speaking on unmount
        };
    }, []);

    useEffect(() => {
        if (timeLeft > 0 && !isFinished && !loading) {
            const id = setInterval(() => setTimeLeft(p => p - 1), 1000);
            return () => clearInterval(id);
        } else if (timeLeft === 0 && !isFinished && !loading) {
            handleSubmitAnswer();
        }
    }, [timeLeft, isFinished, loading]);

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop previous
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;
            window.speechSynthesis.speak(utterance);
        }
    };

    const initializeInterview = async () => {
        try {
            setLoading(true);
            const scheduleRes = await api.get(`/interviews/schedules/${scheduleId}/`);
            if (scheduleRes.data.status === 'COMPLETED') {
                setFinalScore(scheduleRes.data.final_score);
                setIsFinished(true);
                return;
            }

            setInterviewData(scheduleRes.data);

            // Fetch attempt history to know question count
            const attemptRes = await api.get('/interviews/interview-attempts/');
            // Filter attempts for this interview
            const thisAttempts = attemptRes.data.filter(a => a.interview === parseInt(scheduleId));

            if (thisAttempts.length >= MAX_QUESTIONS) {
                // If max reached but status not completed, end it
                await endInterview();
                return;
            }

            if (thisAttempts.length === 0) {
                // Start a fresh one
                const res = await api.post(`/interviews/schedules/${scheduleId}/start/`, { resumeId });
                setCurrentQuestionText(res.data.question);
                speakText(res.data.question);
            } else {
                // Not standard logic to resume an interrupted active question since "next_question" isn't stored in DB directly easily without last attempt
                // For MVP, if there are attempts, we'll just ask them a generic continuation or fetch last attempt's next_question if we had it.
                // We'll generate a new question
                const res = await api.post(`/interviews/schedules/${scheduleId}/start/`, { resumeId });
                setCurrentQuestionText("Let's continue: " + res.data.question);
                speakText("Let's continue. " + res.data.question);
                setQuestionCount(thisAttempts.length + 1);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to initialize AI Interview.');
        } finally {
            setLoading(false);
        }
    };

    const setupWebSocket = () => {
        if (!user) return;
        try {
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Note: backend may still expect "interview" ID. We pass the scheduleId.
            ws.current = new WebSocket(`${proto}//${window.location.host}/ws/proctoring/${scheduleId}/`);
            ws.current.onmessage = (e) => {
                const d = JSON.parse(e.data);
                if (d.type === 'warning') setWarnings(p => [...p, d.message]);
            };
            ws.current.onerror = () => { };
        } catch (e) { console.error("WS Proctoring failed", e); }
    };

    const notifyViolation = (type, message) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type, message }));
        }
    };

    const handleBlur = () => { notifyViolation('tab_switch', 'Candidate switched tabs.'); setWarnings(w => [...w, "Tab Switch Detected (Violation Logged)"]); toast.error("Warning: Tab Switch Detected!"); };
    const handleCopy = () => { notifyViolation('copy_paste', 'Candidate copied text.'); setWarnings(w => [...w, "Copy Detected"]); };
    const handlePaste = () => { notifyViolation('copy_paste', 'Candidate pasted text.'); setWarnings(w => [...w, "Paste Detected"]); toast.error("Pasting is not allowed."); };

    const endInterview = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/interviews/schedules/${scheduleId}/end/`);
            setFinalScore(res.data.score);
            setIsFinished(true);
            toast.success("Interview completed! Generating final report...");
        } catch (err) {
            toast.error("Failed to finalize interview");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async (e) => {
        if (e) e.preventDefault();
        if (submitting || isFinished) return;

        window.speechSynthesis?.cancel(); // stop current speaking
        setSubmitting(true);
        const submittedAnswer = answer || 'Candidate provided no string answer.';
        setAnswer('');

        toast("AI evaluates your answer...", { icon: '🤖' });

        try {
            const res = await api.post(`/interviews/schedules/${scheduleId}/submit-answer/`, {
                question: currentQuestionText,
                answer: submittedAnswer
            });

            if (questionCount >= MAX_QUESTIONS) {
                await endInterview();
            } else {
                setQuestionCount(prev => prev + 1);
                setCurrentQuestionText(res.data.next_question);
                speakText(res.data.next_question);
                setTimeLeft(300); // Reset timer
            }
        } catch (err) {
            toast.error('Failed to submit answer.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium">JobVerse AI is initializing your environment...</p>
        </div>
    );

    if (isFinished) return (
        <div className="max-w-4xl mx-auto my-12 text-center">
            <div className="card p-12 bg-white border border-gray-200">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Interview Completed!</h2>
                <p className="text-gray-500 mb-8 max-w-xl mx-auto">The JobVerse AI Interview Engine has fully evaluated your responses across all questions.</p>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 mb-8 border border-indigo-100 max-w-sm mx-auto shadow-sm">
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Final AI Score</p>
                    <p className="text-6xl font-black text-indigo-700">{finalScore !== null ? Math.round(finalScore) : '--'}<span className="text-indigo-300 text-3xl">%</span></p>
                </div>

                <p className="text-gray-600 mb-8">HR has been notified of your completion and will review your detailed AI analysis report.</p>

                <button onClick={() => navigate('/student/dashboard')} className="btn-primary bg-indigo-600 px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold text-lg">
                    Return to Dashboard
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto my-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Bot className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-gray-900 leading-tight">JobVerse AI Interview</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Role: {interviewData?.job_title} | Round: {interviewData?.round_type?.replace('_', ' ')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700'}`}>
                        <Clock size={16} />{formatTime(timeLeft)}
                    </div>
                    <button onClick={() => { if (window.confirm('Are you sure you want to end? Your score will be calculated based on current progress.')) endInterview(); }} className="btn-secondary text-sm border-red-200 text-red-600 hover:bg-red-50">
                        <Square size={14} className="mr-1" /> End Early
                    </button>
                </div>
            </div>

            {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-2 text-amber-700">
                        <AlertCircle size={18} />
                        <h3 className="font-bold">Proctoring Warnings</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm text-amber-600">
                        {warnings.map((w, i) => <span key={i} className="bg-amber-100 px-2 py-1 rounded">{w}</span>)}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-indigo-600 p-6 text-white flex gap-4 items-start">
                    <div className="mt-1 flex-shrink-0 animate-pulse">
                        <Volume2 size={24} />
                    </div>
                    <div>
                        <div className="text-indigo-200 text-sm font-bold tracking-wider uppercase mb-1">
                            Question {questionCount} of {MAX_QUESTIONS}
                        </div>
                        <p className="text-xl font-medium leading-relaxed">{currentQuestionText}</p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <form onSubmit={handleSubmitAnswer}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="font-bold text-gray-700 flex items-center gap-2">
                                <Mic size={16} className="text-gray-400" /> Your Response
                            </label>
                            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Recording Active
                            </span>
                        </div>
                        <textarea
                            autoFocus
                            required
                            className="w-full min-h-[220px] p-4 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y mb-4 text-gray-800 text-lg leading-relaxed"
                            placeholder="Type your technical answer here. The AI will evaluate this response and generate the next question based on what you write..."
                            value={answer}
                            onChange={e => setAnswer(e.target.value)}
                        />
                        <div className="flex justify-end">
                            <button type="submit" disabled={submitting || !answer.trim()} className="btn-primary bg-indigo-600 px-8 py-3 rounded-lg shadow flex items-center gap-2 text-base">
                                {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={18} />}
                                {submitting ? 'Evaluating...' : 'Submit Answer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InterviewSession;
