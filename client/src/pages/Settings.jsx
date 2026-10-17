import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, upgradeToProLocal } = useAuth();
  const [upgrading, setUpgrading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.put('/auth/upgrade');
      upgradeToProLocal();
      toast.success('🎉 Upgraded to Pro plan!');
    } catch (err) {
      toast.error('Failed to upgrade');
    } finally {
      setUpgrading(false);
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    setShowClearConfirm(false);
    try {
      await api.delete('/sample-data');
      toast.success('All data cleared');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and subscription</p>
      </div>

      {/* Account Info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">Account Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-slate-400 text-xs">Name</p>
            <p className="text-white font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Email</p>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs">Current Plan</p>
            <span className={`inline-block mt-1 text-sm px-3 py-1 rounded-full font-medium ${user?.plan === 'pro' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              {user?.plan === 'pro' ? '✦ Pro Plan' : '⭑ Free Plan'}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Free */}
          <div className={`p-4 rounded-xl border-2 ${user?.plan === 'free' ? 'border-amber-500/50 bg-amber-500/5' : 'border-dark-600'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Free</h3>
              {user?.plan === 'free' && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-4">₹0<span className="text-slate-500 text-base font-normal">/mo</span></p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Up to 2 clients</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unlimited projects</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Task management</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Time tracking</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✗</span> PDF invoices</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✗</span> Financial charts</li>
            </ul>
          </div>

          {/* Pro */}
          <div className={`p-4 rounded-xl border-2 relative overflow-hidden ${user?.plan === 'pro' ? 'border-violet-500/50 bg-violet-500/5' : 'border-primary-500/50 bg-primary-500/5'}`}>
            {user?.plan !== 'pro' && (
              <div className="absolute top-3 right-3">
                <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-bold">POPULAR</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Pro</h3>
              {user?.plan === 'pro' && <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">Current</span>}
            </div>
            <p className="text-3xl font-bold text-white mb-4">₹999<span className="text-slate-500 text-base font-normal">/mo</span></p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unlimited clients</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Unlimited projects</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Advanced tasks</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Time tracking</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> PDF invoices</li>
              <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Financial charts</li>
            </ul>
            {user?.plan !== 'pro' && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="btn-primary w-full justify-center mt-4"
              >
                {upgrading ? 'Upgrading...' : '⚡ Upgrade to Pro'}
              </button>
            )}
          </div>
        </div>
        {user?.plan !== 'pro' && (
          <p className="text-slate-500 text-xs mt-3 text-center">
            * For demo purposes, upgrade is free. No payment gateway required.
          </p>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card border border-red-500/20">
        <h2 className="font-semibold text-red-400 mb-4">⚠ Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Clear All Data</p>
            <p className="text-slate-400 text-sm">Delete all your clients, projects, tasks, time logs, and invoices.</p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={clearing}
            className="btn-danger flex-shrink-0"
          >
            {clearing ? 'Clearing...' : 'Clear Data'}
          </button>
        </div>
      </div>

      {/* Clear Data Confirm */}
      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-white text-lg mb-2">⚠ Clear All Data?</h3>
            <p className="text-slate-400 text-sm mb-4">
              This will permanently delete ALL your clients, projects, tasks, time logs, and invoices. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleClearData} className="btn-danger flex-1 justify-center">Yes, Delete Everything</button>
              <button onClick={() => setShowClearConfirm(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
