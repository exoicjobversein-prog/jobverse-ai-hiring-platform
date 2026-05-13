import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff, ArrowRight, Sparkles, Brain, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthBg from '../components/AuthBg';

const features = [
    { icon: Brain,     label: 'AI Interview Engine', desc: 'Practice with role-specific AI questions' },
    { icon: Briefcase, label: 'Smart Job Matching',  desc: 'Roles tailored to your profile'          },
    { icon: Users,     label: 'Alumni Network',       desc: 'Mentors from top companies'              },
];

const inp = {
    width: '100%', padding: '13px 16px', borderRadius: 12, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color .2s,background .2s',
};
const onFoc = e => { e.target.style.borderColor = '#6366f1'; e.target.style.background = 'rgba(99,102,241,0.1)'; };
const onBlr = e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.background = 'rgba(255,255,255,0.06)'; };

export default function Login({ setUser }) {
    const [form, setForm] = useState({ username: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const { data } = await api.post('/users/login/', form);
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            const profile = await api.get('/users/profile/');
            const user = profile.data;
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
            toast.success(`Welcome back, ${user.first_name || user.username}!`);
            setTimeout(() => {
                if (user.role === 'HR') window.location.href = '/hr/dashboard';
                else if (user.role === 'ALUMNI') window.location.href = '/alumni/dashboard';
                else if (user.role === 'PLACEMENT_ADMIN') window.location.href = '/placement/dashboard';
                else window.location.href = '/student/dashboard';
            }, 300);
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid credentials.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', background: '#000', overflow: 'hidden' }}>
            <style>{`
                @keyframes spinLoader { to { transform: rotate(360deg); } }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* ── Full-screen 3D Background ── */}
            <AuthBg />

            {/* ── Content layer ── */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', display: 'flex', minHeight: '100vh' }}>

                {/* Left branding panel — visible on lg screens */}
                <div style={{ flex: '0 0 55%', display: 'none', flexDirection: 'column', justifyContent: 'space-between', padding: '56px 64px' }}
                    className="login-left-panel">
                    <style>{`@media(min-width:1024px){.login-left-panel{display:flex!important}}`}</style>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(99,102,241,0.45)' }}>
                            <Bot size={22} color="#fff" />
                        </div>
                        <span style={{ color: '#fff', fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px' }}>
                            JobVerse <span style={{ color: '#818cf8' }}>AI</span>
                        </span>
                    </div>

                    {/* Hero text */}
                    <div style={{ animation: 'fadeSlideUp .8s ease forwards' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 12, fontWeight: 600, marginBottom: 24 }}>
                            <Sparkles size={12} /> AI-Powered Hiring Platform
                        </div>
                        <h2 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 18 }}>
                            Land your dream<br />
                            <span style={{ background: 'linear-gradient(90deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                job faster.
                            </span>
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.75, maxWidth: 360, marginBottom: 44 }}>
                            Prepare smarter with AI interviews, discover the perfect match, and build connections that accelerate your career.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {features.map(({ icon: Icon, label, desc }) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 20px rgba(99,102,241,0.1)' }}>
                                        <Icon size={20} color="#818cf8" />
                                    </div>
                                    <div>
                                        <p style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 14 }}>{label}</p>
                                        <p style={{ color: '#475569', fontSize: 13, marginTop: 3 }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>


                </div>

                {/* Right form panel */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                    {/* Glassmorphism glow behind card */}
                    <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, animation: 'fadeSlideUp .9s ease forwards' }}>
                        {/* Mobile logo */}
                        <div className="login-mobile-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: 36 }}>
                            <style>{`@media(min-width:1024px){.login-mobile-logo{display:none!important}}`}</style>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Bot size={20} color="#fff" />
                                </div>
                                <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>JobVerse <span style={{ color: '#818cf8' }}>AI</span></span>
                            </div>
                        </div>

                        {/* Card */}
                        <div style={{
                            background: 'rgba(10,10,20,0.75)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 28,
                            padding: '44px 40px',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}>
                            {/* Card top badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                                    <Bot size={19} color="#fff" />
                                </div>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Sign in to JobVerse</p>
                                    <p style={{ color: '#475569', fontSize: 12 }}>Your AI-powered career platform</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Username</label>
                                    <input id="login-username" style={inp} onFocus={onFoc} onBlur={onBlr}
                                        value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                                        required placeholder="username" autoComplete="username" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <input id="login-password" style={{ ...inp, paddingRight: 50 }} onFocus={onFoc} onBlur={onBlr}
                                            type={showPw ? 'text' : 'password'} value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required placeholder="••••••••" autoComplete="current-password" />
                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
                                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                </div>

                                <button id="login-submit" type="submit" disabled={loading} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    padding: '14px 24px', borderRadius: 14, fontWeight: 800, fontSize: 14,
                                    background: 'linear-gradient(135deg,#6366f1,#7c3aed)',
                                    color: '#fff', border: 'none',
                                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                    boxShadow: '0 8px 30px rgba(99,102,241,0.4)', marginTop: 6,
                                    transition: 'opacity .2s, transform .1s',
                                }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
                                    onMouseLeave={e => e.currentTarget.style.opacity = loading ? '0.7' : '1'}
                                    onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    {loading
                                        ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spinLoader .8s linear infinite' }} />
                                        : <><span>Sign In</span><ArrowRight size={16} /></>}
                                </button>
                            </form>

                            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                                <p style={{ color: '#475569', fontSize: 13 }}>
                                    Don't have an account?{' '}
                                    <Link to="/register" style={{ color: '#818cf8', fontWeight: 700, textDecoration: 'none' }}>
                                        Create one free →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
