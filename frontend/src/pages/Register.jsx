import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot, Eye, EyeOff, Upload, Building2, User2, ShieldCheck, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PLACEMENT_ROLE = 'PLACEMENT_ADMIN';

export default function Register() {
    const [form, setForm] = useState({
        username: '', email: '', password: '', role: 'STUDENT',
        company_name: '', first_name: '', last_name: '',
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

        // Client-side validation for placement admin
        if (isPlacement) {
            if (!proofFile) {
                toast.error('Please upload your proof document (ID card / appointment letter).');
                setLoading(false);
                return;
            }
            const collegeEmailDomain = placement.college_email.split('@')[1]?.toLowerCase() || '';
            if (!collegeEmailDomain.endsWith('.ac.in') && !collegeEmailDomain.endsWith('.edu') && !collegeEmailDomain.endsWith('.edu.in')) {
                toast.error('College email must be from an institutional domain (.ac.in or .edu).');
                setLoading(false);
                return;
            }
        }

        try {
            if (isPlacement) {
                // Multipart form submission for file upload
                const formData = new FormData();
                Object.entries(form).forEach(([k, v]) => formData.append(k, v));
                Object.entries(placement).forEach(([k, v]) => formData.append(k, v));
                formData.append('proof_document', proofFile);
                await api.post('/users/register/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success('Application submitted! Your account is pending verification by our team.', { duration: 5000 });
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
        if (file) {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                toast.error('Only PDF, JPG, or PNG files are accepted.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be under 5 MB.');
                return;
            }
            setProofFile(file);
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
                            <label>
                                Email
                                {isPlacement && <span className="text-amber-400 ml-1 text-xs">(use institutional email, not Gmail/Yahoo)</span>}
                            </label>
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
                                <option value="ALUMNI">Alumni</option>
                                <option value={PLACEMENT_ROLE}>Placement Department / College Admin</option>
                            </select>
                        </div>
                        {(form.role === 'HR' || form.role === 'PROFESSIONAL' || form.role === 'ALUMNI') && (
                            <div>
                                <label>Company / Organization</label>
                                <input className="input-field" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="TechCorp Ltd." />
                            </div>
                        )}

                        {/* ── Placement Admin Conditional Fields ─────────────────────── */}
                        {isPlacement && (
                            <div className="space-y-4 mt-2">
                                {/* Pending badge */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                    <ShieldCheck size={15} className="text-amber-400 shrink-0" />
                                    <p className="text-xs text-amber-300">
                                        This account will be <span className="font-semibold">pending verification</span>. Dashboard access is granted after manual approval.
                                    </p>
                                </div>

                                {/* College Information */}
                                <div className="pt-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 size={14} className="text-indigo-400" />
                                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">College Information</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label>College Name <span className="text-red-400">*</span></label>
                                            <input className="input-field" value={placement.college_name}
                                                onChange={e => setPlacement({ ...placement, college_name: e.target.value })}
                                                placeholder="e.g. MIT College of Engineering" required={isPlacement} />
                                        </div>
                                        <div>
                                            <label>
                                                Official College Email <span className="text-red-400">*</span>
                                                <span className="text-slate-500 ml-1 font-normal">(.ac.in / .edu)</span>
                                            </label>
                                            <input className="input-field" type="email" value={placement.college_email}
                                                onChange={e => setPlacement({ ...placement, college_email: e.target.value })}
                                                placeholder="placement@college.ac.in" required={isPlacement} />
                                        </div>
                                        <div>
                                            <label>College Location <span className="text-slate-500 font-normal">(City, State)</span></label>
                                            <input className="input-field" value={placement.college_location}
                                                onChange={e => setPlacement({ ...placement, college_location: e.target.value })}
                                                placeholder="Pune, Maharashtra" />
                                        </div>
                                        <div>
                                            <label>University / Affiliation <span className="text-slate-500 font-normal">(optional)</span></label>
                                            <input className="input-field" value={placement.university_affiliation}
                                                onChange={e => setPlacement({ ...placement, university_affiliation: e.target.value })}
                                                placeholder="Savitribai Phule Pune University" />
                                        </div>
                                    </div>
                                </div>

                                {/* Placement Officer Details */}
                                <div className="pt-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User2 size={14} className="text-indigo-400" />
                                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Placement Officer Details</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label>Full Name <span className="text-red-400">*</span></label>
                                            <input className="input-field" value={placement.officer_full_name}
                                                onChange={e => setPlacement({ ...placement, officer_full_name: e.target.value })}
                                                placeholder="Dr. Ramesh Kumar" required={isPlacement} />
                                        </div>
                                        <div>
                                            <label>Designation <span className="text-slate-500 font-normal">(optional)</span></label>
                                            <input className="input-field" value={placement.officer_designation}
                                                onChange={e => setPlacement({ ...placement, officer_designation: e.target.value })}
                                                placeholder="Training & Placement Officer" />
                                        </div>
                                        <div>
                                            <label>Contact Number <span className="text-red-400">*</span></label>
                                            <input className="input-field" type="tel" value={placement.officer_contact}
                                                onChange={e => setPlacement({ ...placement, officer_contact: e.target.value })}
                                                placeholder="+91 98765 43210" required={isPlacement} />
                                        </div>
                                    </div>
                                </div>

                                {/* Proof Upload */}
                                <div className="pt-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <ShieldCheck size={14} className="text-indigo-400" />
                                        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Verification Document</span>
                                    </div>
                                    <label>
                                        Upload Proof <span className="text-red-400">*</span>
                                        <span className="text-slate-500 font-normal ml-1">(ID Card / Appointment / Authorization Letter)</span>
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {proofFile ? (
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                            <FileText size={16} className="text-emerald-400 shrink-0" />
                                            <span className="text-sm text-emerald-300 truncate flex-1">{proofFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => { setProofFile(null); fileInputRef.current.value = ''; }}
                                                className="text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current.click()}
                                            className="w-full flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-200 cursor-pointer"
                                        >
                                            <Upload size={20} className="text-slate-500" />
                                            <span className="text-sm text-slate-500">Click to upload • PDF, JPG, PNG • Max 5 MB</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                            {loading
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : isPlacement ? 'Submit for Verification' : 'Create Account'
                            }
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
