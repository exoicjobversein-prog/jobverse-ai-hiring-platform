import { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const HRDashboard = ({ user }) => {
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [newJob, setNewJob] = useState({ title: '', description: '', requirements: '' });
    const [loading, setLoading] = useState(true);

    // Modal state
    const [scheduleModal, setScheduleModal] = useState(null); // application object
    const [scheduleForm, setScheduleForm] = useState({
        interview_type: 'AI',
        round_type: 'AI_SCREENING',
        scheduled_date: '',
        scheduled_time: '',
        meeting_link: ''
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [jobsRes, appRes] = await Promise.all([
                api.get('/jobs/jobs/'),
                api.get('/jobs/applications/')
            ]);
            setJobs(jobsRes.data.filter(j => j.created_by_username === user.username));
            setApplications(appRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async (e) => {
        e.preventDefault();
        try {
            await api.post('/jobs/jobs/', newJob);
            setNewJob({ title: '', description: '', requirements: '' });
            fetchDashboardData();
            toast.success("Job posting created");
        } catch (err) {
            toast.error("Failed to create job");
        }
    };

    const confirmSchedule = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews/schedules/', {
                application: scheduleModal.id,
                ...scheduleForm
            });
            await api.patch(`/jobs/applications/${scheduleModal.id}/`, {
                status: 'INTERVIEWING'
            });
            fetchDashboardData();
            setScheduleModal(null);
            toast.success("Interview Scheduled and Candidate Notified!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to schedule interview.");
        }
    };

    const handleStatusChange = async (appId, newStatus) => {
        try {
            await api.patch(`/jobs/applications/${appId}/`, { status: newStatus });
            toast.success("Status updated");
            fetchDashboardData();
        } catch (err) {
            toast.error("Failed to update status");
        }
    };

    if (loading) return <div className="text-center p-8">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.company_name} - HR Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage job postings and review AI applicant evaluations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Job Form */}
                <div className="card lg:col-span-1 border border-blue-100 bg-blue-50/30">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Post a new Role</h2>
                    <form className="space-y-4" onSubmit={handleCreateJob}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Job Title</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                value={newJob.title}
                                onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                required
                                className="input-field h-24"
                                value={newJob.description}
                                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                            ></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Requirements (Used by AI)</label>
                            <textarea
                                required
                                className="input-field h-24"
                                placeholder="Python, Django, React, 3+ years experience..."
                                value={newJob.requirements}
                                onChange={e => setNewJob({ ...newJob, requirements: e.target.value })}
                            ></textarea>
                        </div>
                        <button type="submit" className="w-full btn-primary bg-blue-700">Create Posting</button>
                    </form>
                </div>

                {/* Applications List */}
                <div className="card lg:col-span-2 shadow-sm border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 flex justify-between">
                        <span>Recent Applications</span>
                        <span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {applications.length} Total
                        </span>
                    </h2>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {applications.length === 0 ? (
                            <p className="text-gray-500 text-sm">No applications received yet.</p>
                        ) : (
                            applications.map(app => (
                                <div key={app.id} className="p-4 border rounded-xl bg-white hover:border-blue-300 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{app.applicant_username}</h3>
                                            <p className="text-sm font-medium text-blue-600">{app.job_title}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <select
                                                className="select-field text-sm py-1 px-2 h-auto text-gray-800"
                                                value={app.status}
                                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="REVIEWED">Under Review</option>
                                                <option value="SHORTLISTED">Shortlisted</option>
                                                <option value="INTERVIEWING">Interviewing</option>
                                                <option value="REJECTED">Rejected</option>
                                                <option value="ACCEPTED">Accepted</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-3 rounded text-sm">
                                            <span className="block text-gray-500 text-xs uppercase mb-1">Resume Details</span>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {app.resume ? "Uploaded" : "N/A"}
                                                </span>
                                                {app.resume_url && (
                                                    <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs">
                                                        <ExternalLink size={12} /> View Resume
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded text-sm">
                                            <span className="block text-gray-500 text-xs uppercase mb-1">Action</span>
                                            {app.status === 'SHORTLISTED' || app.status === 'PENDING' ? (
                                                <button
                                                    onClick={() => setScheduleModal(app)}
                                                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-3 rounded shadow mt-1"
                                                >
                                                    Schedule AI Interview
                                                </button>
                                            ) : (
                                                <span className="text-xs text-indigo-600 font-medium">{app.status}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {scheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-md bg-white border border-gray-200">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-gray-900 font-bold text-lg">Schedule Interview</h2>
                            <button onClick={() => setScheduleModal(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={confirmSchedule} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Interview Type</label>
                                <select className="select-field text-gray-800" value={scheduleForm.interview_type} onChange={e => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })}>
                                    <option value="AI">AI Interview</option>
                                    <option value="LIVE">Live Interview</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Round Type</label>
                                <select className="select-field text-gray-800" value={scheduleForm.round_type} onChange={e => setScheduleForm({ ...scheduleForm, round_type: e.target.value })}>
                                    <option value="TECHNICAL">Technical Round</option>
                                    <option value="AI_SCREENING">AI Screening</option>
                                    <option value="FINAL">Final Round</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input type="date" required className="input-field text-gray-800" value={scheduleForm.scheduled_date} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Time</label>
                                    <input type="time" required className="input-field text-gray-800" value={scheduleForm.scheduled_time} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })} />
                                </div>
                            </div>
                            {scheduleForm.interview_type === 'LIVE' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Meeting Link</label>
                                    <input type="url" className="input-field text-gray-800" placeholder="https://meet.google.com/..." value={scheduleForm.meeting_link} onChange={e => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })} />
                                </div>
                            )}
                            <div className="flex gap-3 justify-end mt-6">
                                <button type="button" onClick={() => setScheduleModal(null)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary bg-indigo-600">Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRDashboard;
