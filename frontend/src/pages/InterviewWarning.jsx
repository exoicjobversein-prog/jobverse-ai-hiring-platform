import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Video, Mic, Wifi, LayoutDashboard, Briefcase, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const InterviewWarning = () => {
    const { id: scheduleId } = useParams();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const res = await api.get(`/interviews/schedules/${scheduleId}/`);
                setSchedule(res.data);
            } catch (err) {
                toast.error('Failed to load interview details.');
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, [scheduleId]);

    const handleStart = () => {
        toast.loading('Preparing Interview Environment...', { duration: 1500 });
        setTimeout(() => {
            // No resumeId needed — backend auto-uses the application resume
            navigate(`/student/interview/${scheduleId}`);
        }, 1500);
    };

    if (loading) return <div className="text-center p-12 text-slate-400">Loading interview details...</div>;

    return (
        <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                <div className="bg-red-100 p-3 rounded-full text-red-600">
                    <AlertTriangle size={36} />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">JobVerse AI Interview Guidelines</h1>
                    <p className="text-gray-500 mt-1">Please read the following instructions carefully before proceeding.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Instructions */}
                <div className="space-y-6 text-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Instructions</h2>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                        <LayoutDashboard className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900">1. Do Not Switch Tabs</h3>
                            <p className="text-sm mt-1">This interview is proctored. Any attempt to switch tabs or open other applications will be recorded as a violation.</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                        <Wifi className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900">2. Stable Internet Connection</h3>
                            <p className="text-sm mt-1">Disconnections during the AI evaluation may result in an incomplete assessment.</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                        <div className="flex gap-1 text-blue-600 mt-1 flex-shrink-0">
                            <Video size={18} />
                            <Mic size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900">3. Camera &amp; Microphone</h3>
                            <p className="text-sm mt-1">Enable your microphone. The AI will speak questions to you, and you must answer verbally or type your response.</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                        <CheckCircle className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-bold text-blue-900">4. Stay in Camera View</h3>
                            <p className="text-sm mt-1">Do not move away from the screen during the duration of the interview.</p>
                        </div>
                    </div>
                </div>

                {/* Interview Info (replaces resume selection) */}
                <div className="space-y-6 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Your Interview</h2>

                    {schedule && (
                        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 space-y-3">
                            <div className="flex items-center gap-2 text-indigo-800 font-bold text-lg">
                                <Briefcase size={20} className="text-indigo-600" />
                                {schedule.job_title || 'AI Interview'}
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm text-indigo-700">
                                <span className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    {new Date(schedule.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock size={14} />
                                    {schedule.scheduled_time}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Resume notice */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex gap-3 items-start">
                        <CheckCircle size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-emerald-900 mb-1">Resume Automatically Selected</h3>
                            <p className="text-sm text-emerald-800">
                                The AI will base your technical questions on the resume you submitted when applying for this role. No action needed.
                            </p>
                        </div>
                    </div>

                    <div className="flex-1" />

                    {/* Action buttons */}
                    <div className="flex gap-4 items-center justify-end pt-4 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            Cancel &amp; Return
                        </button>
                        <button
                            onClick={handleStart}
                            className="px-6 py-3 bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
                        >
                            Agree and Start
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewWarning;
