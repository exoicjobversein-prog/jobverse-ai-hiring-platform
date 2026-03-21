import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useState } from 'react';
import {
    LayoutDashboard, User, FileText, Briefcase, Bot, Brain, BarChart3,
    MessageSquare, CalendarDays, ClipboardList, Settings, LogOut,
    PanelLeftClose, PanelLeftOpen, ChevronRight, Plus, Users, TrendingUp, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const studentNav = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/profile', icon: User, label: 'Profile' },
    { to: '/student/resumes', icon: FileText, label: 'My Resumes' },
    { to: '/student/jobs', icon: Briefcase, label: 'Job Marketplace' },
    { to: '/student/practice', icon: Bot, label: 'Practice AI Interview' },
    { to: '/student/aptitude', icon: Brain, label: 'Aptitude Practice' },
    { to: '/student/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/student/community', icon: MessageSquare, label: 'Community Chat' },
    { to: '/student/workshops', icon: CalendarDays, label: 'Workshops' },
    { to: '/student/applications', icon: ClipboardList, label: 'My Applications' },
];

const hrNav = [
    { to: '/hr/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hr/profile', icon: User, label: 'Profile' },
    { to: '/hr/jobs/new', icon: Plus, label: 'Post a Job' },
    { to: '/hr/jobs', icon: Briefcase, label: 'View Jobs' },
    { to: '/hr/applications', icon: Users, label: 'Applications' },
    { to: '/hr/analytics', icon: TrendingUp, label: 'Analytics' },
];

const alumniNav = [
    { to: '/alumni/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/alumni/profile', icon: User, label: 'Profile' },
    { to: '/alumni/requests', icon: Users, label: 'Student Requests' },
    { to: '/alumni/community', icon: MessageSquare, label: 'Community Chat' },
    { to: '/alumni/jobs', icon: Briefcase, label: 'Job Referrals' },
    { to: '/alumni/jobs/new', icon: Plus, label: 'Post Opportunity' },
    { to: '/alumni/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/alumni/notifications', icon: Bell, label: 'Notifications' },
    { to: '/alumni/settings', icon: Settings, label: 'Settings' },
];

export default function DashboardLayout({ user, setUser, role }) {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const nav = role === 'HR' ? hrNav : role === 'ALUMNI' ? alumniNav : studentNav;

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
        toast.success('Logged out successfully');
        navigate('/login');
    };

    const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

    return (
        <div className="flex min-h-screen bg-slate-950">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${collapsed ? 'w-16' : 'w-64'} flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-30`}>
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
                    {!collapsed && (
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                                <Bot size={16} className="text-white" />
                            </div>
                            <span className="font-extrabold text-white text-lg leading-none">Job<span className="text-indigo-400">Verse</span></span>
                        </Link>
                    )}
                    <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                {/* User pill */}
                {!collapsed && user && (
                    <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {(user.first_name || user.username || '?')[0].toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-white font-semibold text-sm truncate">{user.first_name || user.username}</p>
                                <span className={`badge text-xs ${role === 'HR' ? 'badge-amber' : role === 'ALUMNI' ? 'badge-emerald' : 'badge-indigo'}`}>{role}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                    {nav.map(({ to, icon: Icon, label }) => (
                        <Link key={to} to={to} title={label}
                            className={`sidebar-item ${isActive(to) ? 'active' : ''}`}>
                            <Icon size={18} className="flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                            {!collapsed && isActive(to) && <ChevronRight size={14} className="ml-auto" />}
                        </Link>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-slate-800">
                    <button onClick={handleLogout} title="Logout"
                        className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <LogOut size={18} className="flex-shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <header className="h-14 bg-slate-900/70 backdrop-blur border-b border-slate-800 flex items-center px-6 gap-4 flex-shrink-0">
                    <div className="flex-1" />
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                            {(user?.first_name || user?.username || '?')[0].toUpperCase()}
                        </div>
                        <span className="text-slate-300 text-sm font-medium hidden sm:block">{user?.first_name || user?.username}</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800 py-4 px-6 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>© 2026 JobVerse AI Platform</span>
                    <span className="flex-1" />
                    {['About', 'Contact', 'Privacy Policy', 'Terms'].map(t => (
                        <a key={t} href="#" className="hover:text-indigo-400 transition-colors">{t}</a>
                    ))}
                </footer>
            </div>
        </div>
    );
}
