import { useState, useEffect, useRef } from 'react';
import { Brain, Clock, CheckCircle, XCircle, ChevronRight, Activity, TrendingUp, Edit3, Target, ShieldAlert, MonitorOff, Files, CameraOff, Video, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ProctoringMonitor from '../../components/proctoring/ProctoringMonitor';

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
    const [status, setStatus] = useState('LANDING'); // LANDING, LOADING, PLAYING, RESULTS
    const [selectedCategory, setSelectedCategory] = useState('FULL_TEST');
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState([]); // [{question_id: 1, selected: 'A'}]
    const [timer, setTimer] = useState(TIMER_SECONDS);
    const [results, setResults] = useState(null);
    const [warnings, setWarnings] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [screenshotWarnings, setScreenshotWarnings] = useState(0);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [showEscWarningDialog, setShowEscWarningDialog] = useState(false);
    const [showTabWarningDialog, setShowTabWarningDialog] = useState(false);
    const [showScreenshotWarningDialog, setShowScreenshotWarningDialog] = useState(false);
    const [visited, setVisited] = useState(new Set()); // indices of visited questions
    const [currentSelection, setCurrentSelection] = useState(null); // selected option for current question
    const timerRef = useRef(null);
    const fullscreenListenerRef = useRef(null);
    const visibilityListenerRef = useRef(null);
    const warningsRef = useRef(0); // Keep a ref in sync for use inside event listeners
    const tabSwitchesRef = useRef(0);
    const screenshotWarningsRef = useRef(0);
    const intentionalExitRef = useRef(false); // Track when we intentionally exit fullscreen (submit)
    
    // Comprehensive Proctoring Logs
    const [proctoringLogs, setProctoringLogs] = useState([]);
    const proctoringLogsRef = useRef([]);
    const [severeViolationMsg, setSevereViolationMsg] = useState(null);

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            if (fullscreenListenerRef.current) {
                document.removeEventListener('fullscreenchange', fullscreenListenerRef.current);
            }
            if (visibilityListenerRef.current) {
                document.removeEventListener('visibilitychange', visibilityListenerRef.current);
            }
            document.body.classList.remove('hide-dashboard-sidebar');
        };
    }, []);

    // Keep warningsRef in sync with warnings state
    useEffect(() => {
        warningsRef.current = warnings;
    }, [warnings]);

    useEffect(() => {
        tabSwitchesRef.current = tabSwitches;
    }, [tabSwitches]);

    useEffect(() => {
        screenshotWarningsRef.current = screenshotWarnings;
    }, [screenshotWarnings]);

    const totalViolations = warnings + tabSwitches + screenshotWarnings;
    const totalViolationsRef = () => warningsRef.current + tabSwitchesRef.current + screenshotWarningsRef.current;

    const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

    const prepareTest = async () => {
        setStatus('LOADING');
        try {
            const endpoint = selectedCategory === 'FULL_TEST'
                ? '/interviews/aptitude/questions/full_test/'
                : `/interviews/aptitude/questions/?category=${selectedCategory}`;

            const res = await api.get(endpoint);
            if (res.data.length === 0) {
                toast.error("No questions found in database.");
                setStatus('LANDING');
                return;
            }

            const testTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;

            setQuestions(res.data);
            setCurrent(0);
            setAnswers([]);
            setTimer(testTime);

            // Fetch simulated loading delay
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            setStatus('PRE_TEST_INSTRUCTIONS');
        } catch (error) {
            toast.error("Failed to load test session.");
            setStatus('LANDING');
        }
    };

    const startActualTest = async () => {
        setIsRequestingPermissions(true);
        try {
            // Request camera and microphone access
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                // Stop tracks immediately since the ProctoringMonitor will request its own
                stream.getTracks().forEach(track => track.stop());
            } catch (err) {
                toast.error("Camera and Microphone permissions are strictly required to start the test.");
                setIsRequestingPermissions(false);
                return;
            }
            
            // Now request fullscreen on the button click gesture
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.log("Fullscreen request failed:", err);
            }

            // Reset all violation counters — both state AND refs
            setWarnings(0);
            warningsRef.current = 0;
            setTabSwitches(0);
            tabSwitchesRef.current = 0;
            setScreenshotWarnings(0);
            screenshotWarningsRef.current = 0;
            intentionalExitRef.current = false;
            setProctoringLogs([]);
            proctoringLogsRef.current = [];
            setSevereViolationMsg(null);

            setVisited(new Set([0]));

            // Register proctoring listeners
            if (fullscreenListenerRef.current) {
                document.removeEventListener('fullscreenchange', fullscreenListenerRef.current);
            }
            if (visibilityListenerRef.current) {
                document.removeEventListener('visibilitychange', visibilityListenerRef.current);
            }
            if (window._cleanupKeyDown) {
                document.removeEventListener('keydown', window._cleanupKeyDown);
                window._cleanupKeyDown = null;
            }
            if (window._cleanupKeyUp) {
                document.removeEventListener('keyup', window._cleanupKeyUp);
                window._cleanupKeyUp = null;
            }
            if (window._cleanupBlur) {
                window.removeEventListener('blur', window._cleanupBlur);
                window._cleanupBlur = null;
            }



            const triggerScreenshotWarning = () => {
                if (intentionalExitRef.current) return;
                const newWarnings = screenshotWarningsRef.current + 1;
                screenshotWarningsRef.current = newWarnings;
                setScreenshotWarnings(newWarnings);
                addProctoringLog('screenshot_attempt', 'Attempted to take a screenshot.', 'warning');
                setShowScreenshotWarningDialog(true);
            };

            const handleKeyDown = (e) => {
                const isMacScreenshot = e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key);
                const isPrint = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P');
                const isWindowsSnippet = e.metaKey && e.shiftKey && (e.key === 's' || e.key === 'S');

                if (isMacScreenshot || isPrint || isWindowsSnippet) {
                    e.preventDefault();
                    triggerScreenshotWarning();
                }
            };
            
            const handleKeyUp = (e) => {
                if (e.key === 'PrintScreen') {
                    e.preventDefault();
                    triggerScreenshotWarning();
                }
                
                if (e.key === 's' || e.key === 'S' || e.key === 'Meta' || e.key === 'Shift') {
                    if ((e.metaKey && e.shiftKey) || (e.key === 's' && e.metaKey && e.shiftKey)) {
                         triggerScreenshotWarning();
                    }
                }
            };

            const handleBlur = () => {
                // Windows Snipping tool suspends process execution and blurs the window.
                // If it happens and we aren't intentionally exiting or switching tabs, it's likely snippet.
                if (status === 'PLAYING' && document.fullscreenElement) {
                     // Check if it's the snippet overlay by observing lack of tab switch
                     setTimeout(() => {
                         if (!document.hidden && document.activeElement === document.body) {
                            triggerScreenshotWarning();
                         }
                     }, 150);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            document.addEventListener('keyup', handleKeyUp);
            window.addEventListener('blur', handleBlur);
            
            window._cleanupKeyDown = handleKeyDown;
            window._cleanupKeyUp = handleKeyUp;
            window._cleanupBlur = handleBlur;

            // Detect when fullscreen is exited (ESC key, F11, or any other means)
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                    if (intentionalExitRef.current) {
                        intentionalExitRef.current = false;
                        return;
                    }
                    const newWarnings = warningsRef.current + 1;
                    warningsRef.current = newWarnings;
                    setWarnings(newWarnings);
                    addProctoringLog('fullscreen_exit', 'Exited fullscreen mode.', 'warning');
                    setShowEscWarningDialog(true);
                }
            };
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            fullscreenListenerRef.current = handleFullscreenChange;

            const handleVisibilityChange = () => {
                if (document.hidden) {
                    if (intentionalExitRef.current) return;
                    const newSwitches = tabSwitchesRef.current + 1;
                    tabSwitchesRef.current = newSwitches;
                    setTabSwitches(newSwitches);
                    addProctoringLog('tab_switch', 'Switched to a different tab or application.', 'warning');
                    setShowTabWarningDialog(true);
                }
            };
            document.addEventListener('visibilitychange', handleVisibilityChange);
            visibilityListenerRef.current = handleVisibilityChange;

            setStatus('PLAYING');

            document.body.classList.add('hide-dashboard-sidebar');

            clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
                setTimer(t => {
                    const testTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
                    if (t <= 1) {
                        clearInterval(timerRef.current);
                        submitTest(answers, 0, testTime);
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } catch (error) {
            toast.error("Failed to initialize test environment.");
        } finally {
            setIsRequestingPermissions(false);
        }
    };

    const submitTest = async (finalAnswers, timeRemaining, totalTime, customWarnings = null, customTabSwitches = null, customScreenshotWarnings = null) => {
        clearInterval(timerRef.current);
        document.body.classList.remove('hide-dashboard-sidebar');

        if (fullscreenListenerRef.current) {
            document.removeEventListener('fullscreenchange', fullscreenListenerRef.current);
            fullscreenListenerRef.current = null;
        }
        if (visibilityListenerRef.current) {
            document.removeEventListener('visibilitychange', visibilityListenerRef.current);
            visibilityListenerRef.current = null;
        }
        if (window._cleanupKeyDown) {
            document.removeEventListener('keydown', window._cleanupKeyDown);
            window._cleanupKeyDown = null;
        }
        if (window._cleanupKeyUp) {
            document.removeEventListener('keyup', window._cleanupKeyUp);
            window._cleanupKeyUp = null;
        }
        if (window._cleanupBlur) {
            window.removeEventListener('blur', window._cleanupBlur);
            window._cleanupBlur = null;
        }

        if (document.fullscreenElement) {
            try {
                intentionalExitRef.current = true;
                await document.exitFullscreen();
            } catch(e) {
                intentionalExitRef.current = false;
            }
        }

        const timeTaken = (totalTime || (selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60)) - timeRemaining;
        const violationsCount = customWarnings !== null ? customWarnings : warnings;
        const tabViolationsCount = customTabSwitches !== null ? customTabSwitches : tabSwitches;
        const screenshotViolationsCount = customScreenshotWarnings !== null ? customScreenshotWarnings : screenshotWarnings;

        // Ensure all questions are included in the submission
        const completeAnswers = questions.map(q => {
            const ans = finalAnswers.find(a => a.question_id === q.id);
            return ans ? ans : { question_id: q.id, selected: null };
        });

        try {
            const res = await api.post('/interviews/aptitude/results/evaluate_test/', {
                category: selectedCategory,
                answers: completeAnswers,
                time_taken_seconds: timeTaken,
                fullscreen_violations: violationsCount,
                tab_violations: tabViolationsCount,
                screenshot_violations: screenshotViolationsCount,
                proctoring_logs: proctoringLogsRef.current
            });
            setResults(res.data);
            setStatus('RESULTS');
        } catch (error) {
            toast.error("Failed to submit test.");
        }
    };

    const addProctoringLog = (type, message, severity) => {
        const logEntry = { type, message, severity, timestamp: new Date().toISOString() };
        proctoringLogsRef.current = [...proctoringLogsRef.current, logEntry];
        setProctoringLogs(proctoringLogsRef.current);
        
        if (severity === 'severe' && status === 'PLAYING') {
            setSevereViolationMsg(message);
            // Give the candidate a chance to read the severe warning before auto-submitting
            setTimeout(() => {
                 submitTest(answers, timer, (selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60));
            }, 4000);
        }
    };

    // Effect to monitor warnings and auto-submit when >= 3
    useEffect(() => {
        if (status === 'PLAYING' && warnings >= 3) {
            // Dialog is shown; auto-submit will happen when user dismisses it (or immediately)
            // We don't auto-submit here to give the dialog time to render the final message
        }
    }, [warnings, status]);

    // Force re-enter fullscreen after the ESC warning dialog is dismissed
    const dismissEscWarning = async () => {
        setShowEscWarningDialog(false);
        if (totalViolations >= 3) {
            // 3rd violation: auto-submit
            const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
            await submitTest(answers, timer, totalTime, warnings, tabSwitches, screenshotWarnings);
        } else {
            // Re-enter fullscreen
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (e) {
                console.log('Failed to re-enter fullscreen:', e);
            }
        }
    };

    const dismissTabWarning = async () => {
        setShowTabWarningDialog(false);
        if (totalViolations >= 3) {
            // 3rd violation: auto-submit
            const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
            await submitTest(answers, timer, totalTime, warnings, tabSwitches, screenshotWarnings);
        }
    };

    const dismissScreenshotWarning = async () => {
        setShowScreenshotWarningDialog(false);
        if (totalViolations >= 3) {
            // 3rd violation: auto-submit
            const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
            await submitTest(answers, timer, totalTime, warnings, tabSwitches, screenshotWarnings);
        }
    };

    // Sync selection when current question changes
    useEffect(() => {
        if (questions.length > 0) {
            const existing = answers.find(a => a.question_id === questions[current]?.id);
            setCurrentSelection(existing ? existing.selected : null);
        }
    }, [current, questions]);

    // Select an option (no navigation)
    const handleSelectOption = (option) => {
        setCurrentSelection(option);
        const qId = questions[current].id;
        // Update (or add) the answer in the answers array
        const exists = answers.find(a => a.question_id === qId);
        if (exists) {
            setAnswers(prev => prev.map(a => a.question_id === qId ? { ...a, selected: option } : a));
        } else {
            setAnswers(prev => [...prev, { question_id: qId, selected: option }]);
        }
    };

    // Advance to next question (or end of test)
    const goToNext = () => {
        if (current + 1 >= questions.length) {
            const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
            submitTest(answers, timer, totalTime);
        } else {
            const nextIdx = current + 1;
            setVisited(prev => new Set([...prev, nextIdx]));
            setCurrent(nextIdx);
        }
    };

    const jumpToQuestion = (idx) => {
        setVisited(prev => new Set([...prev, idx]));
        setCurrent(idx);
    };

    const handleManualSubmit = () => {
        setShowSubmitDialog(true);
    };

    const confirmSubmit = () => {
        setShowSubmitDialog(false);
        const totalTime = selectedCategory === 'FULL_TEST' ? 40 * 60 : 10 * 60;
        submitTest(answers, timer, totalTime);
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

                <button onClick={prepareTest} className="btn-primary text-xl px-14 py-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all font-bold">
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

                {results.proctoring_logs && results.proctoring_logs.length > 0 ? (
                    <div className="mb-8 p-5 bg-slate-900 border border-red-500/30 rounded-xl">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                            <ShieldAlert className="text-red-500" size={24} />
                            <h3 className="text-lg font-bold text-white">Proctoring Intervention Logs</h3>
                            <span className="ml-auto bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full">
                                {results.proctoring_logs.length} Infraction{results.proctoring_logs.length > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {results.proctoring_logs.map((log, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${log.severity === 'severe' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                                    <div className="mt-0.5">
                                        {log.severity === 'severe' ? <XCircle size={18} className="text-red-400" /> : <AlertTriangle size={18} className="text-amber-400" />}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm mb-1 ${log.severity === 'severe' ? 'text-red-300' : 'text-amber-300'}`}>{log.message}</p>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="uppercase tracking-wider font-bold opacity-80">{log.type.replace(/_/g, ' ')}</span>
                                            <span>•</span>
                                            <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {results.proctoring_logs.some(l => l.severity === 'severe') && (
                            <div className="mt-4 text-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-bold text-sm">
                                    Severe testing protocol violations were detected. Your test was automatically terminated and submitted.
                                </p>
                            </div>
                        )}
                        {((results.fullscreen_violations || 0) + (results.tab_violations || 0) + (results.screenshot_violations || 0)) >= 3 && !results.proctoring_logs.some(l => l.severity === 'severe') && (
                            <div className="mt-4 text-center p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-400 font-bold text-sm">
                                    The test was automatically submitted due to exceeding the maximum allowed suspicious actions (3).
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    (results.fullscreen_violations > 0 || results.tab_violations > 0 || results.screenshot_violations > 0) && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-4">
                            <XCircle className="text-red-500 mt-0.5 flex-shrink-0" size={24} />
                            <div>
                                <h4 className="text-red-400 font-bold mb-1">Testing Integrity Warning</h4>
                                {results.fullscreen_violations > 0 && (
                                    <p className="text-red-300 text-sm mb-1">
                                        Candidate attempted to exit full-screen mode {results.fullscreen_violations} time(s).
                                    </p>
                                )}
                                {results.tab_violations > 0 && (
                                    <p className="text-red-300 text-sm mb-1">
                                        Candidate attempted to switch browser tabs {results.tab_violations} time(s).
                                    </p>
                                )}
                                {results.screenshot_violations > 0 && (
                                    <p className="text-red-300 text-sm mb-1">
                                        Candidate attempted to take screenshots {results.screenshot_violations} time(s).
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                )}

                <h3 className="font-bold text-xl text-white mb-4 mt-6">Detailed Paper Review</h3>
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
                                                {r.selected ? `Option ${r.selected} - ${r[`option_${r.selected.toLowerCase()}`]}` : 'Unattempted'}
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

    // Loading screen
    if (status === 'LOADING') {
        const testLabel = selectedCategory === 'FULL_TEST' ? 'Full Readiness Test' : getCategoryLabel(selectedCategory);
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Brain size={28} className="text-indigo-400" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-3">Preparing Your Test</h2>
                    <p className="text-slate-400 text-lg mb-2">{testLabel}</p>
                    <p className="text-slate-500 text-sm">Loading questions and securing your environment…</p>
                    <div className="mt-8 flex items-center justify-center gap-2">
                        {[0,1,2].map(i => (
                            <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Pre-Test Instructions & Permissions Modal
    if (status === 'PRE_TEST_INSTRUCTIONS') {
        return (
            <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 z-50">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="bg-slate-800 p-6 border-b border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="text-amber-400" size={28} />
                            <h2 className="text-2xl font-black text-white">Security & Permissions</h2>
                        </div>
                    </div>
                    <div className="p-8 overflow-y-auto flex-1 text-slate-300">
                        <p className="mb-6 text-lg">
                            This assessment is strictly proctored to ensure fairness and integrity. Before you begin, please read the following guidelines:
                        </p>
                        
                        <div className="space-y-4 mb-8">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <div className="p-2 bg-red-500/10 rounded-lg shrink-0 mt-0.5">
                                    <MonitorOff className="text-red-400" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">No Exiting Fullscreen</h4>
                                    <p className="text-sm text-slate-400">Exiting the fullscreen testing environment will be recorded as a violation.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <div className="p-2 bg-red-500/10 rounded-lg shrink-0 mt-0.5">
                                    <Files className="text-red-400" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">No Tab Switching</h4>
                                    <p className="text-sm text-slate-400">Navigating to other tabs or applications is strictly prohibited.</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                <div className="p-2 bg-red-500/10 rounded-lg shrink-0 mt-0.5">
                                    <CameraOff className="text-red-400" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold mb-1">No Screenshots or Copying</h4>
                                    <p className="text-sm text-slate-400">Attempting to capture or highlight test materials will trigger an immediate warning.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-5 mb-2">
                            <h4 className="text-indigo-400 font-bold mb-2 flex items-center gap-2">
                                <Video size={18} /> Camera and Microphone Access Required
                            </h4>
                            <p className="text-sm text-indigo-300">
                                You must grant permission to your camera and microphone on the next prompt. The test cannot begin without these permissions.
                            </p>
                        </div>
                        <p className="text-red-400 font-bold mt-6 text-center text-sm">
                            Exceeding 3 total violations will result in automatic test submission.
                        </p>
                    </div>
                    <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-end gap-4">
                        <button 
                            onClick={() => setStatus('LANDING')} 
                            className="px-6 py-3 font-semibold text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={startActualTest} 
                            disabled={isRequestingPermissions}
                            className={`btn-primary px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isRequestingPermissions ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isRequestingPermissions ? 'Requesting...' : 'I Understand & Enable Camera/Mic'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Helper: get palette color class per question index
    const getPaletteColor = (idx) => {
        const qId = questions[idx]?.id;
        const isAnswered = answers.some(a => a.question_id === qId);
        if (isAnswered) return 'bg-emerald-600 border-emerald-500 text-white'; // answered = green
        if (visited.has(idx)) return 'bg-orange-500 border-orange-400 text-white'; // visited but not answered = orange
        return 'bg-slate-700 border-slate-600 text-slate-300'; // unvisited = gray
    };

    const q = questions[current];
    if (!q) return <div className="text-slate-400 p-10 text-center">Loading test environment…</div>;

    return (
        <div 
            className="flex gap-4 h-screen w-full fixed inset-0 bg-slate-950 overflow-hidden select-none"
            onCopy={(e) => {
                e.preventDefault();
                addProctoringLog('copy_attempt', 'Attempted to copy test content.', 'warning');
                toast.error("Copying text is not allowed during the test.");
            }}
            onCut={(e) => {
                e.preventDefault();
                addProctoringLog('cut_attempt', 'Attempted to cut test content.', 'warning');
                toast.error("Cutting text is not allowed during the test.");
            }}
            onPaste={(e) => {
                e.preventDefault();
                addProctoringLog('paste_attempt', 'Attempted to paste content.', 'warning');
                toast.error("Pasting text is not allowed during the test.");
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                addProctoringLog('right_click', 'Attempted to open context menu.', 'warning');
                toast.error("Right-click is disabled during the test.");
            }}
            onDragStart={(e) => e.preventDefault()}
        >
            
            {/* Severe Violation Overlay (Auto-Submit Lock) */}
            {severeViolationMsg && (
                <div className="fixed inset-0 z-[100] bg-red-950 flex flex-col items-center justify-center p-6 text-center animate-[fadeIn_0.2s_ease] backdrop-blur-md">
                    <ShieldAlert className="text-red-500 mb-6 animate-pulse" size={80} />
                    <h2 className="text-4xl font-black text-white mb-4">Severe Violation Detected</h2>
                    <p className="text-xl text-red-300 font-bold mb-8 max-w-2xl">{severeViolationMsg}</p>
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-500 border-t-slate-300 animate-spin" />
                        Terminating and Automating Test Submission...
                    </div>
                </div>
            )}

            {/* ── Left: Question Palette ── */}
            <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                    <h3 className="text-white font-bold text-sm mb-3">Question Palette</h3>
                    <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-600 flex-shrink-0" />
                            <span className="text-slate-400">Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0" />
                            <span className="text-slate-400">Visited, unanswered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-slate-700 flex-shrink-0" />
                            <span className="text-slate-400">Not visited</span>
                        </div>
                    </div>
                </div>

                {/* Grid of question numbers */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-5 gap-1.5">
                        {questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => jumpToQuestion(idx)}
                                className={`w-full aspect-square rounded-lg text-xs font-bold border transition-all duration-150 hover:scale-105 hover:brightness-110
                                    ${getPaletteColor(idx)}
                                    ${current === idx ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110' : ''}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Submit button at bottom */}
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleManualSubmit}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
                    >
                        Submit Test
                    </button>
                </div>
            </aside>

            {/* ── Right: Question Area ── */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto py-8 px-6">

                    {/* Top bar */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                        <div>
                            <span className="text-indigo-400 font-bold text-xs tracking-widest uppercase mb-1 block">{getCategoryLabel(q.category)}</span>
                            <h1 className="text-xl font-bold text-white">Question {current + 1} <span className="text-slate-500 font-normal">/ {questions.length}</span></h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Warnings Tracker */}
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${
                                totalViolations > 0 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-slate-400 bg-slate-800 border border-slate-700'
                            }`}>
                                <Activity size={16} /> 
                                Violations: {totalViolations}/3
                            </div>
                            
                            {/* Timer */}
                            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-lg ${timer <= 300 ? 'text-red-400 bg-red-500/10 border border-red-500/20' : 'text-indigo-300 bg-indigo-500/10 border border-indigo-500/20'}`}>
                                <Clock size={20} />{formatTime(timer)}
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="score-bar-track mb-6 h-1 relative">
                        <div className="score-bar-fill bg-gradient-to-r from-indigo-500 to-purple-500 absolute h-full top-0 left-0 transition-all duration-300"
                            style={{ width: `${(answers.length / questions.length) * 100}%` }} />
                    </div>

                    {/* Question card */}
                    <div className="card mb-6 py-8 border-slate-700 bg-slate-800/30">
                        <p className="text-white font-semibold text-lg leading-relaxed">{q.question_text}</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-6">
                        {optionLabels.map(l => {
                            const isSelected = currentSelection === l;
                            return (
                                <button key={l} onClick={() => handleSelectOption(l)}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left ${
                                        isSelected
                                            ? 'border-indigo-500 bg-indigo-600/20 ring-1 ring-indigo-500'
                                            : 'border-slate-700 bg-slate-800 hover:border-indigo-500/50 hover:bg-slate-700/50'
                                    }`}>
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'
                                    }`}>{l}</span>
                                    <span className="text-slate-200 text-base">{getOptionText(q, l)}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-2">
                        <button onClick={goToNext} className="text-slate-400 hover:text-white font-medium px-4 py-2 transition-colors">
                            Skip
                        </button>
                        <button
                            onClick={goToNext}
                            disabled={!currentSelection}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${
                                currentSelection
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            {current + 1 === questions.length ? 'Finish' : 'Save & Next →'}
                        </button>
                    </div>

                </div>
            </div>

            {/* AI Webcam Proctoring Monitor */}
            {status === 'PLAYING' && (
                <ProctoringMonitor
                    testId="aptitude_practice"
                    onViolation={(violation) => {
                        // Using our generic add logic. If 'severe', it auto-submits.
                        addProctoringLog(violation.type, violation.msg, violation.severity);
                        
                        if (violation.severity !== 'severe') {
                            toast.error(`Warning: ${violation.msg}`, { duration: 5000 });
                        }
                    }}
                />
            )}

            {/* Custom Submit Confirmation Dialog */}
            {showSubmitDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
                        <p className="text-white font-semibold text-lg mb-6">Do you want to submit the test?</p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setShowSubmitDialog(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors border border-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSubmit}
                                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ESC / Fullscreen Warning Dialog */}
            {showEscWarningDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-[fadeIn_0.2s_ease]">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-500" size={36} />
                        </div>

                        {totalViolations >= 3 ? (
                            <>
                                <h2 className="text-2xl font-black text-red-400 mb-2">Test Terminated!</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    You have exceeded the maximum of <span className="text-red-400 font-bold">3 violations</span> (exiting fullscreen, switching tabs, or taking screenshots).
                                    Your test has been <span className="font-bold text-red-400">automatically submitted</span>.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black text-yellow-400 mb-2">⚠ Fullscreen Warning</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                    Exiting full-screen mode is <span className="text-red-400 font-bold">not allowed</span> during the test.
                                </p>
                                <p className="text-slate-400 text-sm mb-1">
                                    You will be returned to full-screen mode immediately.
                                </p>
                                <div className="mt-3 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                                    <span className="text-red-400 font-bold text-sm">Warning {totalViolations} / 3</span>
                                    <span className="text-slate-400 text-xs">— 3 violations auto-submits the test</span>
                                </div>
                            </>
                        )}

                        <button
                            onClick={dismissEscWarning}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                                totalViolations >= 3
                                    ? 'bg-red-600 hover:bg-red-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                        >
                            {totalViolations >= 3 ? 'View Results' : 'Return to Full-Screen'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Switching Warning Dialog */}
            {showTabWarningDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-[fadeIn_0.2s_ease]">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-500" size={36} />
                        </div>

                        {totalViolations >= 3 ? (
                            <>
                                <h2 className="text-2xl font-black text-red-400 mb-2">Test Terminated!</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    You have exceeded the maximum of <span className="text-red-400 font-bold">3 violations</span> (exiting fullscreen, switching tabs, or taking screenshots).
                                    Your test has been <span className="font-bold text-red-400">automatically submitted</span>.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black text-yellow-400 mb-2">⚠ Focus Violation</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                    Switching browser tabs or minimizing the window is <span className="text-red-400 font-bold">not allowed</span> during the test.
                                </p>
                                <div className="mt-3 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                                    <span className="text-red-400 font-bold text-sm">Warning {totalViolations} / 3</span>
                                    <span className="text-slate-400 text-xs">— 3 violations auto-submits the test</span>
                                </div>
                            </>
                        )}

                        <button
                            onClick={dismissTabWarning}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                                totalViolations >= 3
                                    ? 'bg-red-600 hover:bg-red-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                        >
                            {totalViolations >= 3 ? 'View Results' : 'Return to Test'}
                        </button>
                    </div>
                </div>
            )}

            {/* Screenshot Warning Dialog */}
            {showScreenshotWarningDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative bg-slate-900 border-2 border-red-500/60 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-[fadeIn_0.2s_ease]">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="text-red-500" size={36} />
                        </div>

                        {totalViolations >= 3 ? (
                            <>
                                <h2 className="text-2xl font-black text-red-400 mb-2">Test Terminated!</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                    You have exceeded the maximum of <span className="text-red-400 font-bold">3 violations</span> (exiting fullscreen, switching tabs, or taking screenshots).
                                    Your test has been <span className="font-bold text-red-400">automatically submitted</span>.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-black text-yellow-400 mb-2">⚠ Focus Violation</h2>
                                <p className="text-slate-300 text-sm leading-relaxed mb-2">
                                    Taking screenshots is <span className="text-red-400 font-bold">not allowed</span> during the test.
                                </p>
                                <div className="mt-3 mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                                    <span className="text-red-400 font-bold text-sm">Warning {totalViolations} / 3</span>
                                    <span className="text-slate-400 text-xs">— 3 violations auto-submits the test</span>
                                </div>
                            </>
                        )}

                        <button
                            onClick={dismissScreenshotWarning}
                            className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                                totalViolations >= 3
                                    ? 'bg-red-600 hover:bg-red-500'
                                    : 'bg-indigo-600 hover:bg-indigo-500'
                            }`}
                        >
                            {totalViolations >= 3 ? 'View Results' : 'Return to Test'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
