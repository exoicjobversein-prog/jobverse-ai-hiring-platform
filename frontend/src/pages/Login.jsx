import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff, Sparkles, ArrowRight, Briefcase, Users, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const features = [
    { icon: Brain, label: 'AI Interview Engine', desc: 'Practice with intelligent, role-specific questions' },
    { icon: Briefcase, label: 'Smart Job Matching', desc: 'Get matched to roles that fit your profile' },
    { icon: Users, label: 'Alumni Network', desc: 'Connect with mentors from top companies' },
];

export default function Login({ setUser }) {
    const [form, setForm] = useState({ username: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/users/login/', form);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            const profile = await api.get('/users/profile/');
            const user = profile.data;
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            toast.success(`Welcome back, ${user.first_name || user.username}!`);
            if (user.role === 'HR') navigate('/hr/dashboard');
            else if (user.role === 'ALUMNI') navigate('/alumni/dashboard');
            else if (user.role === 'PLACEMENT_ADMIN') navigate('/placement/dashboard');
            else navigate('/student/dashboard');
        } catch (err) {
            const msg = err.response?.data?.detail || 'Invalid credentials.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-black">

            {/* ── Left Branding Panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-black to-violet-950" />
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Grid lines decoration */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Bot size={22} className="text-white" />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight">JobVerse <span className="text-indigo-400">AI</span></span>
                </div>

                {/* Hero Content */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-6">
                        <Sparkles size={12} /> AI-Powered Hiring Platform
                    </div>
                    <h2 className="text-5xl font-black text-white leading-tight mb-4">
                        Land your dream<br />
                        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            job faster.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
                        Prepare smarter with AI interviews, discover the perfect match, and build connections that accelerate your career.
                    </p>

                    <div className="space-y-4">
                        {features.map(({ icon: Icon, label, desc }) => (
                            <div key={label} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Icon size={18} className="text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">{label}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom stat strip */}
                <div className="relative z-10 flex items-center gap-8">
                    {[['10K+', 'Students'], ['500+', 'Companies'], ['95%', 'Placement Rate']].map(([val, label]) => (
                        <div key={label}>
                            <p className="text-2xl font-black text-white">{val}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
                <div className="absolute inset-0 bg-black" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <span className="text-white font-black text-lg">JobVerse <span className="text-indigo-400">AI</span></span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-white">Welcome back</h1>
                        <p className="text-slate-400 mt-2 text-sm">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                            <input
                                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:bg-indigo-500/5 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                required
                                placeholder="your_username"
                                id="login-username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:bg-indigo-500/5 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 pr-12"
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    placeholder="••••••••"
                                    id="login-password"
                                />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            id="login-submit"
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm mt-2"
                        >
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><span>Sign In</span><ArrowRight size={16} /></>
                            }
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Create one free →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
