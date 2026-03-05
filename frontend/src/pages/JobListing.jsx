import { useState, useEffect } from 'react';
import api from '../services/api';
import { Briefcase, MapPin, DollarSign, Clock } from 'lucide-react';

const JobListing = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyingId, setApplyingId] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs/jobs/');
            setJobs(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch jobs.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (jobId) => {
        // In a real app we would open a modal to select/upload a resume
        // Here we'll just alert that they need a resume
        alert("In this MVP, please apply from the Student Dashboard where you can attach a resume!");
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-lg border border-blue-100">
                <div>
                    <h1 className="text-2xl font-bold text-blue-900">Explore Open Roles</h1>
                    <p className="text-blue-700 mt-1">Find your next technical position verified by AI.</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {jobs.length === 0 && !loading && !error && (
                <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-100">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No jobs posted</h3>
                    <p className="mt-1 text-sm text-gray-500">Check back later for new opportunities.</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                    <div key={job.id} className="card flex flex-col hover:shadow-lg transition-shadow border border-gray-100">
                        <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900 line-clamp-1">{job.title}</h2>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                                By: <span className="font-medium text-gray-700">{job.created_by_username}</span>
                            </p>

                            <div className="mt-4 text-sm text-gray-700 line-clamp-3">
                                {job.description}
                            </div>

                            <div className="mt-4 bg-gray-50 p-3 rounded-md">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Requirements</p>
                                <div className="text-sm text-gray-800 line-clamp-2">
                                    {job.requirements}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => handleApply(job.id)}
                                className="w-full btn-primary"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobListing;
