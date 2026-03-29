import React from 'react';
import { Link } from 'react-router-dom';

const SideNavBar = ({ activeTab = 'dashboard' }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/admin' },
    { id: 'queue', label: 'Queue', icon: 'queue_play_next', path: '/operator' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', path: '/queue-status' }
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: 'settings', path: '/queue-status' },
    { id: 'logout', label: 'Logout', icon: 'logout', path: '/' }
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 border-none bg-white dark:bg-slate-900 shadow-[0_20px_40px_rgba(70,72,212,0.08)] py-6 z-20">
      <div className="px-8 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
          <span className="material-symbols-outlined">queue_play_next</span>
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#4648d4] dark:text-indigo-400">SmartQueue</h1>
          <p className="font-manrope font-semibold tracking-wide text-[10px] uppercase text-on-surface-variant">Editorial Efficiency</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 mx-4 transition-all ${
              activeTab === item.id
                ? 'bg-[#f2f4f6] dark:bg-slate-800 text-[#4648d4] dark:text-indigo-300 rounded-2xl translate-x-1 duration-300'
                : 'text-[#464554] dark:text-slate-400 hover:bg-[#f2f4f6] dark:hover:bg-slate-800'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-manrope font-semibold tracking-wide text-xs uppercase">{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="px-4 mt-auto space-y-2">
        <button className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-95 duration-200 flex items-center justify-center gap-2 mb-6">
          <span className="material-symbols-outlined">add</span>
          Add Ticket
        </button>
        
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className="flex items-center gap-3 text-[#464554] dark:text-slate-400 px-4 py-3 hover:bg-[#f2f4f6] dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-manrope font-semibold tracking-wide text-xs uppercase">{item.label}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default SideNavBar;