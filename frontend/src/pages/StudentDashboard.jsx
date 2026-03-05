import { useState, useEffect } from 'react';
import api from '../services/api';

const StudentDashboard = ({ user }) => {
    const [resumes, setResumes] = useState([]);
    const [applications, setApplications] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [jobs, setJobs] = useState([]);

    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedResumeId, setSelectedResumeId] = useState('');

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [resRes, appRes, schedRes, jobsRes] = await Promise.all([
                api.get('/resumes/resumes/'),
                api.get('/jobs/applications/'),
                api.get('/interviews/schedules/'),
                api.get('/jobs/jobs/')
            ]);

            setResumes(resRes.data);
            if (resRes.data.length > 0) setSelectedResumeId(resRes.data[0].id);

            setApplications(appRes.data);
            setInterviews(schedRes.data);
            setJobs(jobsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => setFile(e.target.files[0]);

    const submitResume = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            await api.post('/resumes/resumes/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            fetchDashboardData();
            setFile(null);
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const applyToJob = async (jobId) => {
        if (!selectedResumeId) return alert("Please upload and select a resume first");

        try {
            await api.post(`/jobs/jobs/${jobId}/apply/`, { resume_id: selectedResumeId });
            alert("Applied Successfully!");
            fetchDashboardData();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to apply");
        }
    };

    const startInterview = (scheduleId) => {
        window.location.href = `/interview-warning/${scheduleId}`;
    };

    if (loading) return <div className="text-center p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.username}</h1>
                <p className="text-gray-600 mt-1">Manage your resumes, track applications, and take AI interviews.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Résumé Section */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Your Resumes</h2>

                    <form className="mb-6 flex gap-2" onSubmit={submitResume}>
                        <input
                            type="file"
                            accept=".pdf,.txt,.docx"
                            onChange={handleFileUpload}
                            className="text-sm text-gray-500 flex-1 border rounded p-1"
                        />
                        <button type="submit" disabled={!file || uploading} className="btn-primary">
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                        {resumes.map(r => (
                            <div key={r.id} className="p-3 border rounded-md bg-white">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium truncate max-w-[200px]">Doc #{r.id}</span>
                                    {r.is_processed ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Score: {r.technical_score}/100</span>
                                    ) : (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Processing AI...</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {resumes.length === 0 && <p className="text-gray-500 text-sm">No resumes uploaded yet.</p>}
                    </div>
                </div>

                {/* Applications & Interviews */}
                <div className="card">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Upcoming Interviews</h2>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                        {interviews.length === 0 ? (
                            <p className="text-gray-500 text-sm">No interviews scheduled yet. You will see them here if an HR schedules an interview.</p>
                        ) : (
                            interviews.map(inv => (
                                <div key={inv.id} className="p-4 border rounded-md bg-blue-50">
                                    <h3 className="font-bold text-blue-900">{inv.job_title} - {inv.round_type?.replace('_', ' ')}</h3>
                                    <p className="text-sm text-gray-700 mt-1 font-medium">Date: {inv.scheduled_date} | Time: {inv.scheduled_time}</p>
                                    <p className="text-xs text-gray-600 mt-1 uppercase tracking-wide">Type: {inv.interview_type}</p>
                                    <div className="mt-4 flex justify-between items-center">
                                        <span className="text-xs font-bold bg-blue-200 text-blue-900 px-2 py-1 rounded-full uppercase">
                                            {inv.status}
                                        </span>
                                        <div className="flex gap-2">
                                            {inv.status === 'Scheduled' && (
                                                <>
                                                    <button onClick={() => window.location.href = `/student/interview-warning/${inv.id}`} className="text-xs font-medium border border-blue-600 text-blue-700 hover:bg-blue-100 py-1.5 px-3 rounded shadow-sm transition-colors">
                                                        View Instructions
                                                    </button>
                                                    <button onClick={() => window.location.href = `/student/interview-warning/${inv.id}`} className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded shadow transition-colors">
                                                        Start Interview
                                                    </button>
                                                </>
                                            )}
                                            {inv.status === 'Completed' && (
                                                <span className="text-sm font-bold text-green-700">Score: {inv.final_score !== null ? `${inv.final_score}%` : 'Pending'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Available Jobs */}
            <div className="card">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">Available Jobs</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => (
                        <div key={job.id} className="border p-4 rounded-md">
                            <h3 className="font-bold text-lg truncate">{job.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{job.description}</p>

                            <div className="mt-4 flex gap-2 items-center">
                                <select
                                    className="input-field py-1"
                                    value={selectedResumeId}
                                    onChange={(e) => setSelectedResumeId(e.target.value)}
                                >
                                    <option value="" disabled>Select Resume</option>
                                    {resumes.map(r => (
                                        <option key={r.id} value={r.id}>Resume #{r.id}</option>
                                    ))}
                                </select>
                                <button onClick={() => applyToJob(job.id)} className="btn-secondary whitespace-nowrap">
                                    Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
