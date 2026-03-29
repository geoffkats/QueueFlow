import React from 'react';
import { Link } from 'react-router-dom';

const BottomNavBar = ({ activeTab = 'home' }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'home', path: '/' },
    { id: 'tickets', label: 'My Tickets', icon: 'confirmation_number', path: '/queue-status' },
    { id: 'locations', label: 'Locations', icon: 'location_on', path: '/admin' },
    { id: 'profile', label: 'Profile', icon: 'person', path: '/operator' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_-20px_40px_rgba(70,72,212,0.08)] rounded-t-[3rem]">
      {navItems.map((item) => (
        <Link
          key={item.id}
          to={item.path}
          className={`flex flex-col items-center justify-center px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90 duration-200 tap-highlight-none ${
            activeTab === item.id
              ? 'bg-[#4648d4]/10 dark:bg-indigo-500/20 text-[#4648d4] dark:text-indigo-300 rounded-2xl'
              : 'text-[#464554] dark:text-slate-400'
          }`}
        >
          <span 
            className="material-symbols-outlined mb-1" 
            style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {item.icon}
          </span>
          <span className="font-inter text-[10px] font-medium tracking-wider uppercase">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNavBar;