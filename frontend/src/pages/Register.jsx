import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'STUDENT', company_name: '', first_name: '', last_name: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/users/register/', form);
            toast.success('Account created! Please sign in.');
            navigate('/login');
        } catch (err) {
            if (err.response?.data) {
                const msgs = Object.entries(err.response.data).map(([k, v]) =>
                    `${k}: ${Array.isArray(v) ? v.join(' ') : v}`
                ).join(' | ');
                toast.error(msgs || 'Registration failed.');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-4">
                        <Bot size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">Join <span className="text-indigo-400">JobVerse</span></h1>
                    <p className="text-slate-400 mt-2 text-sm">Create your professional profile</p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label>First Name</label>
                                <input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Alex" />
                            </div>
                            <div>
                                <label>Last Name</label>
                                <input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Smith" />
                            </div>
                        </div>
                        <div>
                            <label>Username <span className="text-red-400">*</span></label>
                            <input className="input-field" pattern="^[\w.@+\-]+$" title="Letters, numbers and @/./+/-/_ only" value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="alex_smith" />
                        </div>
                        <div>
                            <label>Email</label>
                            <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" />
                        </div>
                        <div>
                            <label>Password <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <input className="input-field pr-10" type={showPw ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min. 8 characters" />
                                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label>I am a...</label>
                            <select className="select-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="STUDENT">Student / Job Seeker</option>
                                <option value="HR">HR Professional / Recruiter</option>
                                <option value="PROFESSIONAL">Industry Professional / Mentor</option>
                            </select>
                        </div>
                        {(form.role === 'HR' || form.role === 'PROFESSIONAL') && (
                            <div>
                                <label>Company / Organization</label>
                                <input className="input-field" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="TechCorp Ltd." />
                            </div>
                        )}
                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-400 mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
