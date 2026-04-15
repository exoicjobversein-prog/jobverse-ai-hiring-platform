import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

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
            else if (user.role === 'PLACEMENT_ADMIN') {
                navigate(user.is_verified ? '/placement/dashboard' : '/placement/pending');
            }
            else navigate('/student/dashboard');
        } catch (err) {
            const msg = err.response?.data?.detail || 'Invalid credentials.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <Bot size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Welcome to <span className="text-indigo-400">JobVerse</span></h1>
                    <p className="text-slate-400 mt-2 text-sm">Your AI-powered hiring platform</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label>Username</label>
                            <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="your_username" />
                        </div>
                        <div>
                            <label>Password</label>
                            <div className="relative">
                                <input className="input-field pr-10" type={showPw ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="••••••••" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-400 mt-5">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">Create one free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
