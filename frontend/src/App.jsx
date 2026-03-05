import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentResumes from './pages/student/Resumes';
import JobMarketplace from './pages/student/JobMarketplace';
import PracticeInterview from './pages/student/PracticeInterview';
import AptitudePractice from './pages/student/AptitudePractice';
import Analytics from './pages/student/Analytics';
import CommunityChat from './pages/student/CommunityChat';
import Workshops from './pages/student/Workshops';
import StudentApplications from './pages/student/Applications';

// HR pages
import HRDashboard from './pages/hr/Dashboard';
import HRProfile from './pages/hr/Profile';
import PostJob from './pages/hr/PostJob';
import HRApplications from './pages/hr/Applications';
import HRAnalytics from './pages/hr/Analytics';

// Interview session
import InterviewSession from './pages/InterviewSession';
import InterviewWarning from './pages/InterviewWarning';

// Layout
import DashboardLayout from './components/DashboardLayout';

const ProtectedRoute = ({ user, allowedRoles, children }) => {
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
    return children;
};

export default function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try { setUser(JSON.parse(storedUser)); } catch { }
        }
        setLoading(false);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const updateUser = (u) => {
        setUser(u);
        if (u) localStorage.setItem('user', JSON.stringify(u));
        else localStorage.removeItem('user');
    };

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px' },
                success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
                error: { iconTheme: { primary: '#f43f5e', secondary: '#f1f5f9' } },
            }} />
            <Routes>
                {/* Public */}
                <Route path="/login" element={<Login setUser={updateUser} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={user ? <Navigate to={user.role === 'HR' ? '/hr/dashboard' : '/student/dashboard'} /> : <Navigate to="/login" />} />

                {/* Student Routes */}
                <Route path="/student" element={
                    <ProtectedRoute user={user} allowedRoles={['STUDENT']}>
                        <DashboardLayout user={user} setUser={updateUser} role="STUDENT" />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" />} />
                    <Route path="dashboard" element={<StudentDashboard user={user} />} />
                    <Route path="profile" element={<StudentProfile user={user} setUser={updateUser} />} />
                    <Route path="resumes" element={<StudentResumes user={user} />} />
                    <Route path="jobs" element={<JobMarketplace user={user} />} />
                    <Route path="practice" element={<PracticeInterview user={user} />} />
                    <Route path="aptitude" element={<AptitudePractice user={user} />} />
                    <Route path="analytics" element={<Analytics user={user} />} />
                    <Route path="community" element={<CommunityChat user={user} />} />
                    <Route path="workshops" element={<Workshops user={user} />} />
                    <Route path="applications" element={<StudentApplications user={user} />} />
                    <Route path="interview-warning/:id" element={<InterviewWarning />} />
                    <Route path="interview/:id" element={<InterviewSession user={user} />} />
                </Route>

                {/* HR Routes */}
                <Route path="/hr" element={
                    <ProtectedRoute user={user} allowedRoles={['HR', 'ADMIN']}>
                        <DashboardLayout user={user} setUser={updateUser} role="HR" />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="dashboard" />} />
                    <Route path="dashboard" element={<HRDashboard user={user} />} />
                    <Route path="profile" element={<HRProfile user={user} setUser={updateUser} />} />
                    <Route path="jobs/new" element={<PostJob user={user} />} />
                    <Route path="applications" element={<HRApplications user={user} />} />
                    <Route path="analytics" element={<HRAnalytics user={user} />} />
                </Route>
            </Routes>
        </Router>
    );
}
