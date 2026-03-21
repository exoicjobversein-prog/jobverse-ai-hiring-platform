import { useState } from 'react';
import { User, Mail, Briefcase, MapPin, Linkedin, Code, Save, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlumniProfile({ user, setUser }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        company: 'Google', // Mock data
        designation: 'Senior Software Engineer', // Mock data
        experience: '5 years',
        location: 'Bangalore, India',
        linkedin: 'https://linkedin.com/in/example',
        skills: 'React, Node.js, Python, System Design',
        bio: 'Passionate software engineer building scalable systems. Always happy to mentor students and review resumes.'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Mock save delay
        setTimeout(() => {
            toast.success('Profile updated successfully!');
            // Update auth state conceptually
            if (setUser) setUser({ ...user, ...formData });
            setLoading(false);
        }, 800);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="h-32 bg-gradient-to-r from-indigo-900 to-violet-900 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                                {formData.first_name ? formData.first_name[0] : 'A'}
                            </div>
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="pt-16 pb-6 px-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{formData.first_name} {formData.last_name}</h1>
                        <p className="text-slate-400 mt-1 flex items-center gap-2">
                            <Briefcase size={14} /> {formData.designation} at {formData.company}
                        </p>
                    </div>
                    <div className="badge badge-emerald py-1.5 px-3 uppercase tracking-wider text-xs">
                        Alumni Directory
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-4">
                    <User className="text-indigo-400" size={20} />
                    <h2 className="text-lg font-semibold text-white">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                        <input className="input-field w-full" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                        <input className="input-field w-full" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input className="input-field w-full pl-9 bg-slate-800/50" name="email" value={formData.email} disabled />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">Contact support to change your email address.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-4 mt-8 border-b border-slate-800 pb-4">
                    <Briefcase className="text-indigo-400" size={20} />
                    <h2 className="text-lg font-semibold text-white">Professional Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Company</label>
                        <input className="input-field w-full" name="company" value={formData.company} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Designation / Role</label>
                        <input className="input-field w-full" name="designation" value={formData.designation} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Years of Experience</label>
                        <input className="input-field w-full" name="experience" value={formData.experience} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input className="input-field w-full pl-9" name="location" value={formData.location} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">LinkedIn URL</label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input className="input-field w-full pl-9 text-indigo-400 font-mono text-sm" name="linkedin" value={formData.linkedin} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills / Expertise</label>
                        <div className="relative">
                            <Code className="absolute left-3 top-3 text-slate-500" size={16} />
                            <textarea className="input-field w-full pl-9 h-20 resize-none py-2.5" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g. React, Node.js, UI/UX" />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Short Bio</label>
                        <textarea className="input-field w-full h-24 resize-none" name="bio" value={formData.bio} onChange={handleChange} placeholder="Tell students about your journey..." />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                    <button type="submit" disabled={loading} className="btn-primary min-w-[140px]">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
