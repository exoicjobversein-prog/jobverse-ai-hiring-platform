import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Bot, Eye, EyeOff, Upload, Building2, User2, ShieldCheck, X,
    FileText, Sparkles, ArrowRight, GraduationCap, Briefcase, Users, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PLACEMENT_ROLE = 'PLACEMENT_ADMIN';

const COLLEGE_OPTIONS = [
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

const ROLE_OPTIONS = [
    { value: 'STUDENT', label: 'Student / Job Seeker', icon: GraduationCap, color: 'indigo' },
    { value: 'HR', label: 'HR Professional / Recruiter', icon: Briefcase, color: 'violet' },
    { value: 'PROFESSIONAL', label: 'Industry Professional / Mentor', icon: Brain, color: 'emerald' },
    { value: 'ALUMNI', label: 'Alumni', icon: Users, color: 'amber' },
    { value: PLACEMENT_ROLE, label: 'Placement Department / College Admin', icon: Building2, color: 'rose' },
];

const inputCls = 'w-full px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-500 focus:bg-indigo-500/5 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all duration-200';
const labelCls = 'block text-sm font-semibold text-slate-300 mb-1.5';

export default function Register() {
    const [form, setForm] = useState({
        username: '', email: '', password: '', role: 'STUDENT',
        company_name: '', college_name: '', first_name: '', last_name: '',
    });
    const [placement, setPlacement] = useState({
        college_name: '', college_email: '', college_location: '',
        university_affiliation: '', officer_full_name: '',
        officer_designation: '', officer_contact: '',
    });
    const [proofFile, setProofFile] = useState(null);
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const isPlacement = form.role === PLACEMENT_ROLE;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if (isPlacement && !proofFile) {
            toast.error('Please upload your proof document (ID card / appointment letter).');
            setLoading(false);
            return;
        }
        try {
            if (isPlacement) {
                const formData = new FormData();
                Object.entries(form).forEach(([k, v]) => formData.append(k, v));
                Object.entries(placement).forEach(([k, v]) => formData.append(k, v));
                formData.append('proof_document', proofFile);
                await api.post('/users/register/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Application submitted! Your account is pending verification.', { duration: 5000 });
            } else {
                await api.post('/users/register/', form);
                toast.success('Account created! Please sign in.');
            }
            navigate('/login');
        } catch (err) {
            if (err.response?.data) {
                const msgs = Object.entries(err.response.data)
                    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
                    .join(' | ');
                toast.error(msgs || 'Registration failed.');
            } else {
                toast.error('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) { toast.error('Only PDF, JPG, or PNG files are accepted.'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5 MB.'); return; }
        setProofFile(file);
    };

    return (
        <div className="min-h-screen flex bg-black">

            {/* ── Left Branding Panel ── */}
            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-12 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-black to-violet-950" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Bot size={22} className="text-white" />
                    </div>
                    <span className="text-white font-black text-xl tracking-tight">JobVerse <span className="text-indigo-400">AI</span></span>
                </div>

                {/* Hero Text */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-semibold mb-6">
                        <Sparkles size={12} /> Join 10,000+ Students
                    </div>
                    <h2 className="text-4xl font-black text-white leading-tight mb-4">
                        Your career starts<br />
                        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            right here.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
                        Join JobVerse to get AI interview practice, smart job matches, and a network that opens doors.
                    </p>

                    {/* Role highlights */}
                    <div className="space-y-3">
                        {[
                            { role: 'Students', desc: 'Practice AI interviews & apply to top companies', color: 'text-indigo-400' },
                            { role: 'HR Teams', desc: 'Post jobs & screen candidates with AI', color: 'text-violet-400' },
                            { role: 'Alumni', desc: 'Mentor juniors & stay connected', color: 'text-amber-400' },
                        ].map(({ role, desc, color }) => (
                            <div key={role} className="flex items-start gap-3">
                                <span className={`text-xs font-black ${color} w-16 mt-0.5 flex-shrink-0`}>{role}</span>
                                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-8">
                    {[['10K+', 'Users'], ['500+', 'Companies'], ['95%', 'Success Rate']].map(([val, label]) => (
                        <div key={label}>
                            <p className="text-xl font-black text-white">{val}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Form Panel ── */}
            <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto relative">
                <div className="absolute inset-0 bg-black" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 w-full max-w-lg">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <Bot size={20} className="text-white" />
                        </div>
                        <span className="text-white font-black text-lg">JobVerse <span className="text-indigo-400">AI</span></span>
                    </div>

                    <div className="mb-7">
                        <h1 className="text-3xl font-black text-white">Create your account</h1>
                        <p className="text-slate-400 mt-1.5 text-sm">It's free — get started in under 2 minutes</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>First Name</label>
                                <input className={inputCls} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Alex" />
                            </div>
                            <div>
                                <label className={labelCls}>Last Name</label>
                                <input className={inputCls} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Smith" />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className={labelCls}>Username <span className="text-red-400">*</span></label>
                            <input className={inputCls} pattern="^[\w.@+\-]+$" title="Letters, numbers and @/./+/-/_ only"
                                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="alex_smith" />
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelCls}>
                                Email
                                {isPlacement && <span className="text-amber-400 ml-1 text-xs font-normal">(use institutional email)</span>}
                            </label>
                            <input className={inputCls} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="alex@example.com" />
                        </div>

                        {/* Password */}
                        <div>
                            <label className={labelCls}>Password <span className="text-red-400">*</span></label>
                            <div className="relative">
                                <input className={`${inputCls} pr-12`} type={showPw ? 'text' : 'password'} value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min. 8 characters" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div>
                            <label className={labelCls}>I am a...</label>
                            <div className="grid grid-cols-1 gap-2">
                                {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
                                    <label key={value}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${form.role === value
                                            ? 'bg-indigo-600/20 border-indigo-500/60 text-white'
                                            : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'}`}>
                                        <input type="radio" name="role" value={value} checked={form.role === value}
                                            onChange={e => setForm({ ...form, role: e.target.value })} className="sr-only" />
                                        <Icon size={16} className={form.role === value ? 'text-indigo-400' : 'text-slate-500'} />
                                        <span className="text-sm font-medium">{label}</span>
                                        {form.role === value && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* College field for Student/Alumni */}
                        {(form.role === 'STUDENT' || form.role === 'ALUMNI') && (
                            <div>
                                <label className={labelCls}>College / University</label>
                                <select className={`${inputCls} cursor-pointer`} value={form.college_name}
                                    onChange={e => setForm({ ...form, college_name: e.target.value })}>
                                    <option value="" className="bg-black">Select your college</option>
                                    {COLLEGE_OPTIONS.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Company field */}
                        {(form.role === 'HR' || form.role === 'PROFESSIONAL' || form.role === 'ALUMNI') && (
                            <div>
                                <label className={labelCls}>Company / Organization</label>
                                <input className={inputCls} value={form.company_name}
                                    onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="TechCorp Ltd." />
                            </div>
                        )}

                        {/* ── Placement Admin Extra Fields ── */}
                        {isPlacement && (
                            <div className="space-y-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10 mt-2">
                                {/* Warning badge */}
                                <div className="flex items-start gap-3 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-300 leading-relaxed">
                                        This account will be <span className="font-bold">pending verification</span>. Dashboard access is granted after manual approval.
                                    </p>
                                </div>

                                {/* College Info */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={13} className="text-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">College Information</span>
                                    </div>
                                    <label className={labelCls}>College Name <span className="text-red-400">*</span></label>
                                    <select className={`${inputCls} cursor-pointer`} value={placement.college_name}
                                        onChange={e => setPlacement({ ...placement, college_name: e.target.value })} required={isPlacement}>
                                        <option value="" className="bg-black">Select your college</option>
                                        {COLLEGE_OPTIONS.map(c => <option key={c} value={c} className="bg-black">{c}</option>)}
                                    </select>
                                </div>

                                {/* Officer Details */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <User2 size={13} className="text-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Placement Officer</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className={labelCls}>Designation <span className="text-slate-500 font-normal">(optional)</span></label>
                                            <input className={inputCls} value={placement.officer_designation}
                                                onChange={e => setPlacement({ ...placement, officer_designation: e.target.value })}
                                                placeholder="Training & Placement Officer" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Contact Number <span className="text-red-400">*</span></label>
                                            <input className={inputCls} type="tel" value={placement.officer_contact}
                                                onChange={e => setPlacement({ ...placement, officer_contact: e.target.value })}
                                                placeholder="+91 98765 43210" required={isPlacement} />
                                        </div>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldCheck size={13} className="text-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Verification Document</span>
                                    </div>
                                    <label className={labelCls}>
                                        Upload Proof <span className="text-red-400">*</span>
                                        <span className="text-slate-500 font-normal ml-1 text-xs">(ID Card / Appointment Letter)</span>
                                    </label>
                                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                                    {proofFile ? (
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <FileText size={16} className="text-emerald-400 shrink-0" />
                                            <span className="text-sm text-emerald-300 truncate flex-1">{proofFile.name}</span>
                                            <button type="button"
                                                onClick={() => { setProofFile(null); fileInputRef.current.value = ''; }}
                                                className="text-slate-400 hover:text-red-400 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => fileInputRef.current.click()}
                                            className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-200">
                                            <Upload size={20} className="text-slate-500" />
                                            <span className="text-sm text-slate-500">Click to upload • PDF, JPG, PNG • Max 5 MB</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={loading} id="register-submit"
                            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] text-sm mt-2">
                            {loading
                                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><span>{isPlacement ? 'Submit for Verification' : 'Create Account'}</span><ArrowRight size={16} /></>
                            }
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                                Sign in →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
