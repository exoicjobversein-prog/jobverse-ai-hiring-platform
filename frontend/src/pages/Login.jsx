import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff, ArrowRight, Sparkles, Brain, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthBg from '../components/AuthBg';

const features = [
    { icon: Brain,    label: 'AI Interview Engine', desc: 'Practice with role-specific AI questions' },
    { icon: Briefcase,label: 'Smart Job Matching',  desc: 'Roles tailored to your profile'          },
    { icon: Users,    label: 'Alumni Network',       desc: 'Mentors from top companies'              },
];

const inp = {
    width:'100%', padding:'13px 16px', borderRadius:12,
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
    color:'#fff', fontSize:14, outline:'none', transition:'border-color .2s,background .2s',
};
const onFoc = e => { e.target.style.borderColor='#6366f1'; e.target.style.background='rgba(99,102,241,0.08)'; };
const onBlr = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; };

export default function Login({ setUser }) {
    const [form, setForm] = useState({ username:'', password:'' });
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
            if (user.role === 'HR') navigate('/hr/dashboard');
            else if (user.role === 'ALUMNI') navigate('/alumni/dashboard');
            else if (user.role === 'PLACEMENT_ADMIN') navigate('/placement/dashboard');
            else navigate('/student/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Invalid credentials.');
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight:'100vh', display:'flex', background:'#000' }}>

            {/* ── Left 3D Panel ── */}
            <div style={{ display:'none', position:'relative', overflow:'hidden', flexDirection:'column', justifyContent:'space-between', padding:'56px', flex:'0 0 50%' }}
                className="lg-panel">
                <style>{`.lg-panel{display:none} @media(min-width:1024px){.lg-panel{display:flex}}`}</style>
                <AuthBg />

                {/* Logo */}
                <div style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(99,102,241,0.4)' }}>
                        <Bot size={22} color="#fff" />
                    </div>
                    <span style={{ color:'#fff', fontWeight:900, fontSize:20, letterSpacing:'-0.5px' }}>JobVerse <span style={{ color:'#818cf8' }}>AI</span></span>
                </div>

                {/* Hero */}
                <div style={{ position:'relative', zIndex:10 }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', fontSize:12, fontWeight:600, marginBottom:24 }}>
                        <Sparkles size={12} /> AI-Powered Hiring Platform
                    </div>
                    <h2 style={{ fontSize:48, fontWeight:900, color:'#fff', lineHeight:1.15, marginBottom:16 }}>
                        Land your dream<br />
                        <span style={{ background:'linear-gradient(90deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>job faster.</span>
                    </h2>
                    <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, maxWidth:320, marginBottom:36 }}>
                        Prepare smarter with AI interviews, discover the perfect match, and build connections that accelerate your career.
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                        {features.map(({ icon: Icon, label, desc }) => (
                            <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                                <div style={{ width:40, height:40, borderRadius:10, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                    <Icon size={18} color="#818cf8" />
                                </div>
                                <div>
                                    <p style={{ color:'#fff', fontWeight:600, fontSize:14 }}>{label}</p>
                                    <p style={{ color:'#475569', fontSize:12, marginTop:2 }}>{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ position:'relative', zIndex:10, display:'flex', gap:40 }}>
                    {[['10K+','Students'],['500+','Companies'],['95%','Placement Rate']].map(([v,l]) => (
                        <div key={l}>
                            <p style={{ color:'#fff', fontWeight:900, fontSize:22 }}>{v}</p>
                            <p style={{ color:'#475569', fontSize:11, marginTop:2 }}>{l}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 24px', overflow:'hidden', background:'linear-gradient(135deg,#050508 60%,#0a0a14)' }}>
                <div style={{ position:'absolute', top:'-20%', right:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', pointerEvents:'none' }} />

                <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:440 }}>
                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:40, backdropFilter:'blur(20px)', boxShadow:'0 30px 60px rgba(0,0,0,0.5)' }}>
                        <div style={{ marginBottom:32 }}>
                            <h1 style={{ fontSize:30, fontWeight:900, color:'#fff' }}>Welcome back</h1>
                            <p style={{ color:'#64748b', fontSize:13, marginTop:6 }}>Sign in to continue your journey</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                            <div>
                                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#cbd5e1', marginBottom:8 }}>Username</label>
                                <input id="login-username" style={inp} onFocus={onFoc} onBlur={onBlr}
                                    value={form.username} onChange={e => setForm({...form, username:e.target.value})}
                                    required placeholder="your_username" />
                            </div>
                            <div>
                                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#cbd5e1', marginBottom:8 }}>Password</label>
                                <div style={{ position:'relative' }}>
                                    <input id="login-password" style={{...inp, paddingRight:48}} onFocus={onFoc} onBlur={onBlr}
                                        type={showPw ? 'text' : 'password'} value={form.password}
                                        onChange={e => setForm({...form, password:e.target.value})} required placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPw(!showPw)}
                                        style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:0 }}>
                                        {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>
                            <button id="login-submit" type="submit" disabled={loading} style={{
                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                padding:'14px 24px', borderRadius:12, fontWeight:700, fontSize:14,
                                background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', border:'none',
                                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                                boxShadow:'0 8px 30px rgba(99,102,241,0.35)', marginTop:4,
                            }}>
                                {loading
                                    ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spinLoader 0.8s linear infinite' }} />
                                    : <><span>Sign In</span><ArrowRight size={16}/></>}
                            </button>
                            <style>{`@keyframes spinLoader{to{transform:rotate(360deg)}}`}</style>
                        </form>

                        <div style={{ marginTop:28, paddingTop:24, borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
                            <p style={{ color:'#64748b', fontSize:13 }}>
                                Don't have an account?{' '}
                                <Link to="/register" style={{ color:'#818cf8', fontWeight:600, textDecoration:'none' }}>Create one free →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
