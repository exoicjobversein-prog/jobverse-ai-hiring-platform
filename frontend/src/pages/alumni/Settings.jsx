import { useState } from 'react';
import { Settings as SettingsIcon, Shield, Bell, Key, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Settings({ user, setUser }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const [notifSettings, setNotifSettings] = useState({
        emailAlerts: true,
        pushNotifications: true,
        projectUpdates: false,
    });

    const handlePasswordChange = (e) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            toast.error('New passwords do not match!');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            toast.success('Password updated successfully!');
            setPasswordData({ current: '', new: '', confirm: '' });
            setLoading(false);
        }, 1000);
    };

    const handleLogout = () => {
        if (setUser) setUser(null);
        localStorage.clear();
        navigate('/login');
        toast.success('Logged out securely');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-slate-400 mt-1">Manage your security preferences and notifications.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left Sidebar Menu */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 font-medium rounded-lg border border-indigo-500/20 text-left transition-colors">
                        <Key size={18} /> Security & Password
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg text-left transition-colors">
                        <Bell size={18} /> Notifications
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg text-left transition-colors">
                        <Shield size={18} /> Privacy
                    </button>
                </div>

                {/* Right Content Area */}
                <div className="md:col-span-2 space-y-6">
                    
                    {/* Password Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <Key className="text-indigo-400" size={20} />
                            <h2 className="text-lg font-semibold text-white">Change Password</h2>
                        </div>
                        
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
                                <input type="password" required className="input-field w-full" 
                                    value={passwordData.current} onChange={e => setPasswordData({...passwordData, current: e.target.value})} />
                            </div>
                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                                <input type="password" required className="input-field w-full" 
                                    value={passwordData.new} onChange={e => setPasswordData({...passwordData, new: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
                                <input type="password" required className="input-field w-full" 
                                    value={passwordData.confirm} onChange={e => setPasswordData({...passwordData, confirm: e.target.value})} />
                            </div>
                            <div className="pt-4 flex justify-end">
                                <button type="submit" disabled={loading} className="btn-primary min-w-[140px]">
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Notification Toggles */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                            <Bell className="text-indigo-400" size={20} />
                            <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                        </div>
                        
                        <div className="space-y-4">
                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-slate-200">Email Alerts</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receive emails for direct messages and connection requests.</p>
                                </div>
                                <input type="checkbox" className="toggle toggle-indigo" checked={notifSettings.emailAlerts}
                                    onChange={e => setNotifSettings({...notifSettings, emailAlerts: e.target.checked})} />
                            </label>
                            
                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-slate-200">Push Notifications</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Show browser notifications when you are active.</p>
                                </div>
                                <input type="checkbox" className="toggle toggle-indigo" checked={notifSettings.pushNotifications}
                                    onChange={e => setNotifSettings({...notifSettings, pushNotifications: e.target.checked})} />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-slate-800/30 rounded-lg transition-colors">
                                <div>
                                    <p className="font-medium text-slate-200">JobVerse Updates</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receive our monthly platform newsletter.</p>
                                </div>
                                <input type="checkbox" className="toggle toggle-indigo" checked={notifSettings.projectUpdates}
                                    onChange={e => setNotifSettings({...notifSettings, projectUpdates: e.target.checked})} />
                            </label>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
                        <p className="text-sm text-slate-400 mb-4">Want to sign out of your account entirely?</p>
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2">
                            <LogOut size={16} /> Secure Logout
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
