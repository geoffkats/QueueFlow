import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { queueService } from '../../firebase/queueService';

const OperatorEmptyState = ({ sessionStats, onRefreshQueue }) => {
  const [recentActivity, setRecentActivity] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    latency: 42,
    status: 'Stable',
    percentage: 80
  });

  // Get real recent activity from Firebase
  useEffect(() => {
    const unsubscribe = queueService.subscribeToRecentActivity((activity) => {
      setRecentActivity(activity.slice(0, 3)); // Show last 3 activities
    });

    return () => unsubscribe();
  }, []);

  // Simulate real-time system health updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        ...prev,
        latency: Math.floor(Math.random() * 20) + 35, // 35-55ms
        percentage: Math.floor(Math.random() * 20) + 75 // 75-95%
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    if (onRefreshQueue) {
      onRefreshQueue();
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hours ago`;
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Center Hero Section */}
      <div className="lg:col-span-12 flex flex-col items-center text-center py-12 px-6 bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(70,72,212,0.08)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">done_all</span>
        </div>
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-primary-fixed-dim rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              bedtime_off
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-secondary-container text-on-secondary-container px-2 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase">
            All Clear
          </div>
        </div>
        <div className="max-w-lg mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label text-xs font-bold tracking-wider uppercase mb-4">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            Ready for Next Guest
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
            The queue is currently empty.
          </h2>
          <p className="font-body text-base text-on-surface-variant leading-relaxed mb-8">
            You're all caught up! This is a great time to review your recent history or take a quick break.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-headline font-bold text-base hover:opacity-95 transition-all flex items-center gap-2 shadow-[0_20px_40px_rgba(70,72,212,0.08)] active:scale-95 duration-200"
              onClick={handleRefresh}
            >
              <span className="material-symbols-outlined">refresh</span>
              Refresh Queue
            </button>
            <Link 
              to="/operator-history"
              className="bg-surface-container-highest text-on-surface-variant px-6 py-3 rounded-full font-headline font-bold text-base hover:bg-surface-variant transition-all active:scale-95 duration-200"
            >
              View History
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-primary">groups</span>
            <span className="text-[9px] font-bold tracking-widest text-on-surface-variant uppercase bg-white/40 px-2 py-1 rounded">Daily Volume</span>
          </div>
          <div>
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {sessionStats?.clientsServed || 0}
            </p>
            <p className="text-sm font-body text-on-surface-variant font-medium">Total Served Today</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-primary">timer</span>
            <span className="text-[9px] font-bold tracking-widest text-on-surface-variant uppercase bg-white/40 px-2 py-1 rounded">Efficiency</span>
          </div>
          <div>
            <p className="text-3xl font-headline font-extrabold text-on-surface">
              {sessionStats?.avgService || '0:00'}
            </p>
            <p className="text-sm font-body text-on-surface-variant font-medium">Avg. Service Time</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-low p-6 rounded-xl flex flex-col justify-between h-32">
          <div className="flex items-center justify-between">
            <span className="material-symbols-outlined text-primary">sentiment_very_satisfied</span>
            <span className="text-[9px] font-bold tracking-widest text-on-surface-variant uppercase bg-white/40 px-2 py-1 rounded">Status</span>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-headline font-extrabold text-on-surface">Ready</p>
            </div>
            <p className="text-sm font-body text-on-surface-variant font-medium">System Status</p>
          </div>
        </div>
      </div>

      {/* Recent Activity and Tips */}
      <div className="lg:col-span-7 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20">
        <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold font-headline">{getInitials(activity.name)}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{activity.name}</p>
                  <p className="text-xs text-on-surface-variant">{activity.service}</p>
                </div>
                <p className="text-xs font-medium text-on-surface-variant">
                  {formatTimeAgo(activity.createdAt)}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-on-surface-variant">No recent activity</p>
              <p className="text-xs text-on-surface-variant mt-1">Start serving clients to see activity here</p>
            </div>
          )}
        </div>
        <Link 
          to="/operator-history"
          className="mt-6 text-primary font-headline font-bold text-sm flex items-center gap-2 hover:underline"
        >
          View Full History
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>

      {/* Right Side Cards */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-primary text-on-primary p-6 rounded-xl relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[9px] font-bold tracking-widest uppercase mb-2 opacity-80">Pro Tip</p>
            <h4 className="font-headline font-bold text-base mb-2">Optimize your station</h4>
            <p className="text-sm opacity-90 leading-relaxed font-body">
              Use this downtime to check your supplies and prepare for the next rush.
            </p>
          </div>
          <div className="absolute -bottom-2 -right-2 opacity-20 transform rotate-12">
            <span className="material-symbols-outlined text-6xl">lightbulb</span>
          </div>
        </div>

        <div className="bg-surface-container-high p-6 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold font-headline">System Health</span>
            <span className="text-[9px] font-bold text-primary">LIVE</span>
          </div>
          <div className="space-y-2">
            <div className="h-1.5 w-full bg-surface-container-low rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${systemHealth.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">
              Latency: {systemHealth.latency}ms ({systemHealth.status})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorEmptyState;