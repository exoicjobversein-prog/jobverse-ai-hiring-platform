import { Clock, ShieldCheck, Mail, Phone, ArrowRight, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
    {
        icon: ShieldCheck,
        title: 'Application Received',
        desc: 'Your registration and proof document have been submitted successfully.',
        done: true,
    },
    {
        icon: Clock,
        title: 'Under Review',
        desc: 'Our team is verifying your institutional credentials and proof document.',
        done: false,
    },
    {
        icon: Building2,
        title: 'Access Granted',
        desc: 'Once verified, you\'ll receive full access to the Placement Admin dashboard.',
        done: false,
    },
];

export default function PlacementPendingVerification() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 shadow-lg shadow-amber-500/10 mb-4">
                        <Clock size={30} className="text-amber-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white">
                        Account <span className="text-amber-400">Pending</span>
                    </h1>
                    <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto">
                        Your Placement Admin application has been submitted and is under review.
                    </p>
                </div>

                {/* Status card */}
                <div className="card mb-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Verification Progress</h2>
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${
                                    step.done
                                        ? 'bg-emerald-500/20 border border-emerald-500/40'
                                        : 'bg-slate-800 border border-slate-700'
                                }`}>
                                    <step.icon size={14} className={step.done ? 'text-emerald-400' : 'text-slate-500'} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${step.done ? 'text-emerald-300' : 'text-slate-400'}`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                                </div>
                                {step.done && (
                                    <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">Done</span>
                                )}
                                {i === 1 && (
                                    <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">In Progress</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* What to expect */}
                <div className="card mb-5">
                    <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">What Happens Next?</h2>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li className="flex items-center gap-2">
                            <ArrowRight size={13} className="text-indigo-400 shrink-0" />
                            Our team will review your proof document within <span className="text-slate-200 font-medium ml-1">1–2 business days</span>.
                        </li>
                        <li className="flex items-center gap-2">
                            <ArrowRight size={13} className="text-indigo-400 shrink-0" />
                            You'll receive an email confirmation once your account is verified.
                        </li>
                        <li className="flex items-center gap-2">
                            <ArrowRight size={13} className="text-indigo-400 shrink-0" />
                            After verification, log in to access the Placement Admin dashboard.
                        </li>
                    </ul>
                </div>

                {/* Contact */}
                <div className="card">
                    <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Need Help?</h2>
                    <div className="space-y-2">
                        <a href="mailto:support@jobverse.in" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Mail size={14} />
                            support@jobverse.in
                        </a>
                        <a href="tel:+919876543210" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            <Phone size={14} />
                            +91 98765 43210
                        </a>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link to="/login" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                        ← Back to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
