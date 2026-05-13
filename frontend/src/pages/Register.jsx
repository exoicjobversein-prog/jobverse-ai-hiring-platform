import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff, Upload, Building2, User2, ShieldCheck, X, FileText, ArrowRight, GraduationCap, Briefcase, Users, Brain } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import AuthBg from '../components/AuthBg';

const PLACEMENT_ROLE = 'PLACEMENT_ADMIN';

const COLLEGES = [
    'Indian Institute of Management (IIM) Indore',
    'Indian Institute of Technology (IIT) Indore',
    'Shri Govindram Seksaria Institute of Technology and Science (SGSITS)',
    'Devi Ahilya Vishwavidyalaya (DAVV)',
    'Holkar Science College',
    'Mahatma Gandhi Memorial Medical College (MGM)',
    'Institute of Engineering and Technology (IET DAVV)',
    'Prestige Institute of Engineering Management and Research (PIEMR)',
    'Indore Institute of Law',
    'Acropolis Institute of Technology and Research',
];

const ROLES = [
    { value:'STUDENT',        label:'Student / Job Seeker',              icon: GraduationCap },
    { value:'HR',             label:'HR Professional / Recruiter',        icon: Briefcase     },
    { value:'PROFESSIONAL',   label:'Industry Professional / Mentor',     icon: Brain         },
    { value:'ALUMNI',         label:'Alumni',                             icon: Users         },
    { value:PLACEMENT_ROLE,   label:'Placement Dept / College Admin',     icon: Building2     },
];

const inp = {
    width:'100%', padding:'11px 14px', borderRadius:10, boxSizing:'border-box',
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
    color:'#fff', fontSize:13, outline:'none', transition:'border-color .2s,background .2s',
};
const onFoc = e => { e.target.style.borderColor='#6366f1'; e.target.style.background='rgba(99,102,241,0.08)'; };
const onBlr = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; };
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'#94a3b8', marginBottom:6 };

export default function Register() {
    const [form, setForm] = useState({ username:'', email:'', password:'', role:'STUDENT', company_name:'', college_name:'', first_name:'', last_name:'' });
    const [placement, setPlacement] = useState({ college_name:'', officer_designation:'', officer_contact:'' });
    const [proofFile, setProofFile] = useState(null);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();
    const isPlacement = form.role === PLACEMENT_ROLE;

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        if (isPlacement && !proofFile) { toast.error('Please upload your proof document.'); setLoading(false); return; }
        try {
            if (isPlacement) {
                const fd = new FormData();
                Object.entries(form).forEach(([k,v]) => fd.append(k,v));
                Object.entries(placement).forEach(([k,v]) => fd.append(k,v));
                fd.append('proof_document', proofFile);
                await api.post('/users/register/', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
                toast.success('Application submitted! Pending verification.', { duration:5000 });
            } else {
                await api.post('/users/register/', form);
                toast.success('Account created! Please sign in.');
            }
            navigate('/login');
        } catch (err) {
            const msgs = err.response?.data
                ? Object.entries(err.response.data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(' '):v}`).join(' | ')
                : 'Registration failed.';
            toast.error(msgs);
        } finally { setLoading(false); }
    };

    const handleFile = (e) => {
        const f = e.target.files[0]; if (!f) return;
        if (!['application/pdf','image/jpeg','image/png','image/jpg'].includes(f.type)) { toast.error('PDF, JPG or PNG only.'); return; }
        if (f.size > 5*1024*1024) { toast.error('Max 5 MB.'); return; }
        setProofFile(f);
    };

    return (
        <div style={{ minHeight:'100vh', display:'flex', background:'#000' }}>
            <style>{`@keyframes spinLoader{to{transform:rotate(360deg)}} @media(min-width:1024px){.reg-bg-panel{display:flex!important}}`}</style>

            {/* ── Left Form Panel (wide) ── */}
            <div style={{ flex:1, position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 24px', overflowY:'auto', background:'linear-gradient(135deg,#050508 60%,#0a0a14)' }}>
                <div style={{ position:'absolute', top:'-10%', left:'-10%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)', pointerEvents:'none' }} />

                <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:620 }}>
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
                        <div style={{ width:42, height:42, borderRadius:12, background:'linear-gradient(135deg,#6366f1,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Bot size={20} color="#fff" />
                        </div>
                        <span style={{ color:'#fff', fontWeight:900, fontSize:18 }}>JobVerse <span style={{ color:'#818cf8' }}>AI</span></span>
                    </div>

                    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:24, padding:40, backdropFilter:'blur(20px)', boxShadow:'0 30px 60px rgba(0,0,0,0.5)' }}>
                        <div style={{ marginBottom:28 }}>
                            <h1 style={{ fontSize:28, fontWeight:900, color:'#fff' }}>Create your account</h1>
                            <p style={{ color:'#64748b', fontSize:13, marginTop:6 }}>Free · Get started in under 2 minutes</p>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                            {/* Name row */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                <div>
                                    <label style={lbl}>First Name</label>
                                    <input style={inp} onFocus={onFoc} onBlur={onBlr} value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} placeholder="Alex" />
                                </div>
                                <div>
                                    <label style={lbl}>Last Name</label>
                                    <input style={inp} onFocus={onFoc} onBlur={onBlr} value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} placeholder="Smith" />
                                </div>
                            </div>

                            {/* Username + Email row */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                                <div>
                                    <label style={lbl}>Username <span style={{ color:'#f87171' }}>*</span></label>
                                    <input style={inp} onFocus={onFoc} onBlur={onBlr} pattern="^[\w.@+\-]+$"
                                        value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required placeholder="alex_smith" />
                                </div>
                                <div>
                                    <label style={lbl}>
                                        Email
                                        {isPlacement && <span style={{ color:'#fbbf24', marginLeft:4, fontWeight:400, fontSize:11 }}>(institutional only)</span>}
                                    </label>
                                    <input style={inp} onFocus={onFoc} onBlur={onBlr} type="email"
                                        value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="alex@example.com" />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={lbl}>Password <span style={{ color:'#f87171' }}>*</span></label>
                                <div style={{ position:'relative' }}>
                                    <input style={{...inp,paddingRight:46}} onFocus={onFoc} onBlur={onBlr}
                                        type={showPw?'text':'password'} value={form.password}
                                        onChange={e=>setForm({...form,password:e.target.value})} required placeholder="Min. 8 characters" />
                                    <button type="button" onClick={()=>setShowPw(!showPw)}
                                        style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:0 }}>
                                        {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                                    </button>
                                </div>
                            </div>

                            {/* Role radio */}
                            <div>
                                <label style={lbl}>I am a...</label>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                                    {ROLES.map(({ value, label, icon:Icon }) => {
                                        const active = form.role === value;
                                        return (
                                            <label key={value} style={{
                                                display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, cursor:'pointer',
                                                background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                                                border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.08)',
                                                transition:'all .15s',
                                            }}>
                                                <input type="radio" name="role" value={value} checked={active}
                                                    onChange={e=>setForm({...form,role:e.target.value})} style={{ display:'none' }} />
                                                <Icon size={15} color={active?'#818cf8':'#475569'} />
                                                <span style={{ fontSize:12, fontWeight:600, color: active?'#e2e8f0':'#64748b' }}>{label}</span>
                                                {active && <div style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:'#818cf8' }} />}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* College */}
                            {(form.role==='STUDENT'||form.role==='ALUMNI') && (
                                <div>
                                    <label style={lbl}>College / University</label>
                                    <select style={{...inp,cursor:'pointer'}} onFocus={onFoc} onBlur={onBlr}
                                        value={form.college_name} onChange={e=>setForm({...form,college_name:e.target.value})}>
                                        <option value="" style={{ background:'#0a0a14' }}>Select your college</option>
                                        {COLLEGES.map(c=><option key={c} value={c} style={{ background:'#0a0a14' }}>{c}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Company */}
                            {(form.role==='HR'||form.role==='PROFESSIONAL'||form.role==='ALUMNI') && (
                                <div>
                                    <label style={lbl}>Company / Organization</label>
                                    <input style={inp} onFocus={onFoc} onBlur={onBlr}
                                        value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} placeholder="TechCorp Ltd." />
                                </div>
                            )}

                            {/* Placement Admin extras */}
                            {isPlacement && (
                                <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
                                    <div style={{ display:'flex', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)' }}>
                                        <ShieldCheck size={15} color="#fbbf24" style={{ flexShrink:0, marginTop:1 }} />
                                        <p style={{ fontSize:12, color:'#fde68a', lineHeight:1.5 }}>
                                            This account will be <strong>pending verification</strong>. Access is granted after manual approval.
                                        </p>
                                    </div>

                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:-4 }}>
                                        <Building2 size={12} color="#818cf8" />
                                        <span style={{ fontSize:11, fontWeight:700, color:'#818cf8', letterSpacing:'0.08em', textTransform:'uppercase' }}>College Information</span>
                                    </div>
                                    <select style={{...inp,cursor:'pointer'}} onFocus={onFoc} onBlur={onBlr}
                                        value={placement.college_name} onChange={e=>setPlacement({...placement,college_name:e.target.value})} required={isPlacement}>
                                        <option value="" style={{ background:'#0a0a14' }}>Select your college</option>
                                        {COLLEGES.map(c=><option key={c} value={c} style={{ background:'#0a0a14' }}>{c}</option>)}
                                    </select>

                                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:-4 }}>
                                        <User2 size={12} color="#818cf8" />
                                        <span style={{ fontSize:11, fontWeight:700, color:'#818cf8', letterSpacing:'0.08em', textTransform:'uppercase' }}>Placement Officer</span>
                                    </div>
                                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                        <div>
                                            <label style={lbl}>Designation <span style={{ color:'#475569', fontWeight:400 }}>(optional)</span></label>
                                            <input style={inp} onFocus={onFoc} onBlur={onBlr} value={placement.officer_designation}
                                                onChange={e=>setPlacement({...placement,officer_designation:e.target.value})} placeholder="T&P Officer" />
                                        </div>
                                        <div>
                                            <label style={lbl}>Contact <span style={{ color:'#f87171' }}>*</span></label>
                                            <input style={inp} onFocus={onFoc} onBlur={onBlr} type="tel" value={placement.officer_contact}
                                                onChange={e=>setPlacement({...placement,officer_contact:e.target.value})} placeholder="+91 98765 43210" required={isPlacement} />
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                                            <ShieldCheck size={12} color="#818cf8" />
                                            <span style={{ fontSize:11, fontWeight:700, color:'#818cf8', letterSpacing:'0.08em', textTransform:'uppercase' }}>Verification Document <span style={{ color:'#f87171' }}>*</span></span>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display:'none' }} onChange={handleFile} />
                                        {proofFile ? (
                                            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
                                                <FileText size={15} color="#34d399" />
                                                <span style={{ fontSize:13, color:'#6ee7b7', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{proofFile.name}</span>
                                                <button type="button" onClick={()=>{ setProofFile(null); fileInputRef.current.value=''; }}
                                                    style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:0 }}>
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={()=>fileInputRef.current.click()} style={{
                                                width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                                                padding:'20px', borderRadius:10, border:'2px dashed rgba(255,255,255,0.1)',
                                                background:'none', cursor:'pointer', transition:'border-color .2s',
                                            }}
                                                onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,0.5)'}
                                                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'}>
                                                <Upload size={18} color="#475569" />
                                                <span style={{ fontSize:12, color:'#475569' }}>Click to upload • PDF, JPG, PNG • Max 5 MB</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <button id="register-submit" type="submit" disabled={loading} style={{
                                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                                padding:'14px 24px', borderRadius:12, fontWeight:700, fontSize:14,
                                background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', border:'none',
                                cursor: loading?'not-allowed':'pointer', opacity: loading?0.7:1,
                                boxShadow:'0 8px 30px rgba(99,102,241,0.35)', marginTop:4,
                            }}>
                                {loading
                                    ? <div style={{ width:20, height:20, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spinLoader 0.8s linear infinite' }} />
                                    : <><span>{isPlacement?'Submit for Verification':'Create Account'}</span><ArrowRight size={16}/></>}
                            </button>
                        </form>

                        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center' }}>
                            <p style={{ color:'#64748b', fontSize:13 }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color:'#818cf8', fontWeight:600, textDecoration:'none' }}>Sign in →</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right 3D Background Panel ── */}
            <div className="reg-bg-panel" style={{ display:'none', position:'relative', overflow:'hidden', flex:'0 0 38%' }}>
                <AuthBg />
                <div style={{ position:'relative', zIndex:10, padding:48, display:'flex', flexDirection:'column', justifyContent:'center', height:'100%' }}>
                    <h2 style={{ fontSize:40, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
                        Your career<br/>starts{' '}
                        <span style={{ background:'linear-gradient(90deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>right here.</span>
                    </h2>
                    <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, maxWidth:280 }}>
                        Join 10,000+ students, recruiters, and alumni on the platform built for modern hiring.
                    </p>

                </div>
            </div>
        </div>
    );
}
