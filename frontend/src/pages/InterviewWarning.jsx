import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Video, Mic, Wifi, LayoutDashboard, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const InterviewWarning = () => {
    const { id: scheduleId } = useParams();
    const navigate = useNavigate();

    const [resumes, setResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const res = await api.get('/resumes/resumes/');
                setResumes(res.data);
                if (res.data.length > 0) {
                    setSelectedResumeId(res.data[0].id);
                }
            } catch (err) {
                toast.error("Failed to load resumes.");
            } finally {
                setLoading(false);
            }
        };
        fetchResumes();
    }, []);

    const handleFileUpload = (e) => setFile(e.target.files[0]);

    const submitResume = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        const loadingToast = toast.loading("Uploading Resume...");
        try {
            const res = await api.post('/resumes/resumes/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(loadingToast);
            toast.success("Resume uploaded successfully!");
            setResumes([res.data, ...resumes]);
            setSelectedResumeId(res.data.id);
            setFile(null);
            e.target.reset();
        } catch (err) {
            toast.dismiss(loadingToast);
            console.error(err);
            toast.error("Failed to upload resume");
        } finally {
            setUploading(false);
        }
    };

    const handleStart = () => {
        if (!selectedResumeId) {
            toast.error("Please select or upload a resume to proceed.");
            return;
        }

        toast.loading("Preparing Interview Environment...", { duration: 1500 });
        setTimeout(() => {
            navigate(`/student/interview/${scheduleId}?resumeId=${selectedResumeId}`);
        }, 1500);
    };

    if (loading) return <div className="text-center p-12">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto my-12 p-8 bg-white border border-gray-200 rounded-xl shadow-lg">
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
                            <h3 className="font-bold text-blue-900">3. Camera & Microphone</h3>
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

                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Resume Selection</h2>
                    <p className="text-sm text-gray-600">The AI will base technical questions on the context of your resume. Please select an existing resume or upload a new one tailored for this role.</p>

                    <div className="bg-gray-50 border border-gray-200 p-5 rounded-lg">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Select Existing Resume</label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                            value={selectedResumeId}
                            onChange={(e) => setSelectedResumeId(e.target.value)}
                        >
                            <option value="" disabled>-- Select a Resume --</option>
                            {resumes.map(r => (
                                <option key={r.id} value={r.id}>Resume #{r.id} (Score: {r.technical_score || 'N/A'})</option>
                            ))}
                        </select>
                        {resumes.length === 0 && <p className="text-xs text-red-500 mt-1">No resumes found. Please upload one below.</p>}

                        <div className="mt-6 border-t pt-4 border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                <Upload size={16} /> Upload New Resume
                            </label>
                            <form className="flex gap-2 items-center" onSubmit={submitResume}>
                                <input
                                    type="file"
                                    accept=".pdf,.txt,.docx"
                                    onChange={handleFileUpload}
                                    className="text-sm text-gray-600 flex-1 border border-gray-300 rounded p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={!file || uploading}
                                    className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 disabled:bg-indigo-400 text-sm font-medium transition-colors"
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 flex gap-4 items-center bg-gray-50 p-6 rounded-lg border border-gray-200 justify-end">
                        <button
                            onClick={() => navigate('/student/dashboard')}
                            className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            Cancel & Return
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
