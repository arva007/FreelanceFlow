import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/clients', label: 'Clients', icon: '👥' },
  { path: '/projects', label: 'Projects', icon: '📁' },
  { path: '/tasks', label: 'Tasks', icon: '✓' },
  { path: '/time-tracking', label: 'Time Tracking', icon: '⏱' },
  { path: '/invoices', label: 'Invoices', icon: '📄' },
  { path: '/financials', label: 'Financials', icon: '📊' },
  { path: '/settings', label: 'Settings', icon: '⚙' },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { isRunning, elapsed, formatTime } = useTimer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-dark-800 border-r border-dark-700 z-40 flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg">
              F
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">FreelanceFlow</h1>
              <p className="text-slate-500 text-xs">Project Management</p>
            </div>
          </div>
        </div>

        {/* Timer indicator */}
        {isRunning && (
          <div className="mx-3 mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-medium">Timer Running</span>
            </div>
            <p className="text-emerald-300 font-mono text-sm font-bold mt-0.5">{formatTime(elapsed)}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User / Plan */}
        <div className="p-3 border-t border-dark-700">
          <div className="px-3 py-2 mb-2 rounded-lg bg-dark-700/50">
            <p className="text-slate-300 text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${user?.plan === 'pro' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              {user?.plan === 'pro' ? '✦ Pro Plan' : '⭑ Free Plan'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <span>↩</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
