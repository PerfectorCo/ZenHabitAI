
import React from 'react';
import { User, Mail, Target, Save, Cloud, LogOut, Bell, ShieldCheck, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, onSave, onLogout }) => {
  const [formData, setFormData] = React.useState(profile);
  const [isSaving, setIsSaving] = React.useState(false);
  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "default"
  );

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate DB network latency
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
          <p className="text-slate-500">Manage your personal information and goal settings.</p>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-semibold transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-center pb-6 border-b border-slate-50">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
              {formData.name.charAt(0)}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-xs font-bold text-white">Change</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Full Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" /> Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Target size={16} className="text-indigo-500" /> Main Habit Focus
          </label>
          <select
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
            value={formData.mainGoal}
            onChange={e => setFormData({ ...formData, mainGoal: e.target.value })}
          >
            <option>Improve productivity</option>
            <option>Physical fitness</option>
            <option>Mental health</option>
            <option>Learning skills</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Short Bio</label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-24 resize-none"
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="pt-6 mt-4 border-t border-slate-100">
           <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Bell size={18} className="text-indigo-500" /> System Permissions
           </h3>
           <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${notifPermission === 'granted' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                    {notifPermission === 'granted' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                 </div>
                 <div>
                    <p className="text-sm font-bold text-slate-700">Browser Notifications</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Status: {notifPermission}</p>
                 </div>
              </div>
              {notifPermission !== 'granted' && (
                <button 
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Enable Now
                </button>
              )}
           </div>
        </div>

        <div className="pt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 disabled:opacity-70"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

// Fix: Added default export for Profile component
export default Profile;
