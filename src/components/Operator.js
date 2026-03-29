import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { queueService } from '../firebase/queueService';
import OperatorEmptyState from './shared/OperatorEmptyState';

const Operator = () => {
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [sessionStats, setSessionStats] = useState({
    sessionTime: '00:00',
    avgService: '00:00',
    clientsServed: 0
  });

  useEffect(() => {
    // Subscribe to currently serving person
    const unsubscribeServing = queueService.subscribeToCurrentlyServing((serving) => {
      setCurrentlyServing(serving);
    });

    // Subscribe to waiting queue
    const unsubscribeQueue = queueService.subscribeToQueue((waitingQueue) => {
      setUpcomingQueue(waitingQueue.slice(0, 5)); // Show next 5
    });

    // Subscribe to session statistics
    const unsubscribeStats = queueService.subscribeToSessionStats((stats) => {
      setSessionStats(stats);
    });

    return () => {
      unsubscribeServing();
      unsubscribeQueue();
      unsubscribeStats();
    };
  }, []);

  const handleCallNext = async () => {
    try {
      await queueService.callNext();
    } catch (error) {
      console.error('Error calling next:', error);
      alert(error.message || 'Failed to call next person');
    }
  };

  const handleMarkCompleted = async () => {
    if (currentlyServing) {
      try {
        await queueService.markAsDone(currentlyServing.id);
      } catch (error) {
        console.error('Error marking as completed:', error);
        alert('Failed to mark as completed');
      }
    }
  };

  const handleMarkNoShow = async () => {
    if (currentlyServing) {
      try {
        await queueService.markAsNoShow(currentlyServing.id);
      } catch (error) {
        console.error('Error marking as no-show:', error);
        alert('Failed to mark as no-show');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'border-error';
      case 'senior': return 'border-tertiary-container';
      default: return 'border-primary';
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'bg-error-container text-on-error-container';
      case 'senior': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  return (
    <div className="bg-background font-body text-on-surface antialiased">
      {/* Side Navigation Bar */}
      <aside className="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-50 dark:bg-slate-950 flex flex-col gap-2 p-4 h-full z-40 hidden md:flex">
        <div className="px-4 py-6 mb-4">
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-50 font-headline">QueueFlow</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Operator: {sessionStats.operatorInfo?.status || 'Loading...'}
          </p>
          {sessionStats.operatorInfo && (
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${
                sessionStats.operatorInfo.status === 'Serving' ? 'bg-primary animate-pulse' :
                sessionStats.operatorInfo.status === 'Ready' ? 'bg-tertiary' : 'bg-outline-variant'
              }`}></div>
              <span className="text-[10px] text-slate-600 font-medium">
                {sessionStats.operatorInfo.queueLength} in queue
              </span>
            </div>
          )}
        </div>
        
        <nav className="flex flex-col gap-2">
          <Link to="/operator" className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm active:translate-x-1 duration-150 font-manrope text-sm font-medium">
            <span className="material-symbols-outlined">queue</span>
            <span>Live Queue</span>
          </Link>
          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all font-manrope text-sm font-medium">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <Link to="/operator-history" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all font-manrope text-sm font-medium">
            <span className="material-symbols-outlined">history</span>
            <span>History</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all font-manrope text-sm font-medium">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </Link>
        </nav>
        
        <div className="mt-auto p-4 bg-surface-container-low rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5vfFsFjb_9wz63ZrOtR-yq7Vwr3C7vQLw8v5XAQUtRHimdug9OBTQAq2n0uh0RgbwmVDjQNYa_hkbDf6Y2-PuCqIBmGeh-8q4ilt-n7O3apFTnm0trEwCdIgpYisJC2BEkohrIPKdm3aQRsueAQSX1tP8l1QUKIorRN6OBVHEY5iAcZsDb6VxgO3qiFvWMopUrdxV1FjzHZJ2Wtcwnf9VY62KpeYgfotJ8NhOhIgGMzuBbddnidPJY8fsAiAV7orjbM1ZGZSGF4hT"
                alt="Operator profile"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">
                {sessionStats.operatorInfo?.counterId || 'Counter --'}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                ID: {sessionStats.operatorInfo?.operatorId || 'OP-----'}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  sessionStats.operatorInfo?.status === 'Serving' ? 'bg-primary animate-pulse' :
                  sessionStats.operatorInfo?.status === 'Ready' ? 'bg-tertiary' : 'bg-outline-variant'
                }`}></div>
                <span className="text-[9px] font-medium text-on-surface-variant">
                  {sessionStats.operatorInfo?.status || 'Loading...'}
                </span>
              </div>
            </div>
          </div>
          <button 
            className="w-full py-2 bg-primary text-on-primary rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            onClick={handleCallNext}
            disabled={!upcomingQueue.length}
          >
            {upcomingQueue.length > 0 ? 'Call Next Guest' : 'No Queue'}
          </button>
          {sessionStats.operatorInfo && (
            <div className="mt-2 text-center">
              <p className="text-[9px] text-on-surface-variant">
                Queue: {sessionStats.operatorInfo.queueLength} waiting
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm dark:shadow-none flex justify-between items-center px-6 py-3 w-full md:pl-72">
        <div className="flex items-center gap-4">
          <span className="md:hidden font-bold text-primary">QF</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full pulse-ring ${
              sessionStats.operatorInfo?.status === 'Serving' ? 'bg-primary' :
              sessionStats.operatorInfo?.status === 'Ready' ? 'bg-tertiary' : 'bg-outline-variant'
            }`}></div>
            <span className="text-sm font-headline font-semibold text-on-surface tracking-tight">
              {sessionStats.operatorInfo?.status === 'Serving' ? 'Live Session' :
               sessionStats.operatorInfo?.status === 'Ready' ? 'Ready to Serve' : 'Standby'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-colors active:scale-95 duration-200">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="pt-20 pb-12 px-6 md:pl-72 md:pr-12 min-h-screen">
        {/* Check if there's no queue and no one serving */}
        {!currentlyServing && upcomingQueue.length === 0 ? (
          <OperatorEmptyState 
            sessionStats={sessionStats} 
            onRefreshQueue={() => window.location.reload()} 
          />
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Primary Control Panel */}
          <section className="lg:col-span-7 flex flex-col gap-6">
            {/* Serving Status Hero */}
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_20px_40px_rgba(70,72,212,0.06)] flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
              <span className="font-label text-xs uppercase tracking-[0.1em] text-on-surface-variant mb-2">Current Serving</span>
              <div className="my-6">
                <span className="font-headline text-[7rem] leading-none font-extrabold text-primary tracking-tighter">
                {currentlyServing ? 
                  (sessionStats.clientsServed + 1).toString().padStart(3, '0') : 
                  '---'
                }
              </span>
              </div>
              <div className="flex flex-col items-center gap-1 mb-10">
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  {currentlyServing ? currentlyServing.name : 'No one serving'}
                </h2>
                {currentlyServing && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-semibold">
                    <span className="material-symbols-outlined text-sm">person</span>
                    Service: {currentlyServing.service}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <button 
                  className="sm:col-span-3 py-5 bg-primary text-on-primary rounded-lg font-headline text-lg font-bold shadow-[0_10px_20px_rgba(70,72,212,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={handleCallNext}
                  disabled={!upcomingQueue.length}
                >
                  Call Next Client
                </button>
                <button 
                  className="py-4 bg-tertiary-container/10 text-tertiary-container rounded-lg font-bold hover:bg-tertiary-container/20 transition-colors"
                  onClick={handleMarkCompleted}
                  disabled={!currentlyServing}
                >
                  Mark as Completed
                </button>
                <button 
                  className="py-4 bg-error-container/10 text-error rounded-lg font-bold hover:bg-error-container/20 transition-colors"
                  onClick={handleMarkNoShow}
                  disabled={!currentlyServing}
                >
                  Mark as No-Show
                </button>
                <button className="py-4 bg-surface-container-low text-on-surface-variant rounded-lg font-bold hover:bg-surface-container transition-colors">
                  Skip
                </button>
              </div>
            </div>

            {/* Session Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-surface-container-low p-5 rounded-lg">
                <p className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant mb-1">Session Time</p>
                <p className="text-xl font-headline font-bold">{sessionStats.sessionTime}</p>
              </div>
              <div className="bg-surface-container-low p-5 rounded-lg">
                <p className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant mb-1">Avg Service</p>
                <p className="text-xl font-headline font-bold">{sessionStats.avgService}</p>
              </div>
              <div className="bg-surface-container-low p-5 rounded-lg col-span-2 sm:col-span-1">
                <p className="text-[10px] font-label uppercase tracking-wider text-on-surface-variant mb-1">Clients Served</p>
                <p className="text-xl font-headline font-bold">{sessionStats.clientsServed}</p>
              </div>
            </div>
          </section>

          {/* Right Column: Queue Preview */}
          <section className="lg:col-span-5">
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="font-headline text-xl font-bold text-on-surface">
                Up Next <span className="text-primary font-medium text-base ml-1">({upcomingQueue.length} in queue)</span>
              </h3>
              <button className="text-primary text-sm font-semibold hover:underline">View All</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {upcomingQueue.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-lg text-center">
                  <p className="text-on-surface-variant">No one in queue</p>
                </div>
              ) : (
                upcomingQueue.map((item, index) => (
                  <div key={item.id} className={`group bg-surface-container-lowest p-5 rounded-lg flex items-center justify-between transition-all hover:shadow-md border-l-4 ${getPriorityColor(item.priority)}`}>
                    <div className="flex items-center gap-4">
                      <span className="font-headline text-xl font-extrabold text-on-surface-variant group-hover:text-primary transition-colors">
                        {(index + 1).toString().padStart(3, '0')}
                      </span>
                      <div>
                        <h4 className="font-semibold text-on-surface">{item.name}</h4>
                        <p className="text-xs text-on-surface-variant">Est. wait: {(index + 1) * 5} mins</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getPriorityBadgeColor(item.priority)}`}>
                      {item.priority}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Secondary Info Section */}
            <div className="mt-8 bg-primary/5 rounded-xl p-6 border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-primary">info</span>
                <h5 className="font-headline font-bold text-on-surface">Queue Insight</h5>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {upcomingQueue.length > 0 ? (
                  <>Traffic is currently <span className="text-primary font-bold">normal</span>. 
                  Next person has <span className="text-primary font-bold">{upcomingQueue[0]?.priority}</span> priority.</>
                ) : (
                  'Queue is empty. Great job clearing the backlog!'
                )}
              </p>
            </div>
          </section>
        </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-slate-50/95 backdrop-blur-md z-50 flex items-center justify-around px-2 py-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <Link to="/operator" className="flex flex-col items-center gap-1 text-primary">
          <span className="material-symbols-outlined">queue</span>
          <span className="text-[10px] font-bold">Live</span>
        </Link>
        <Link to="/admin" className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-medium">Dash</span>
        </Link>
        <Link to="/operator-history" className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px] font-medium">History</span>
        </Link>
        <Link to="/" className="flex flex-col items-center gap-1 text-slate-400">
          <span className="material-symbols-outlined">settings</span>
          <span className="text-[10px] font-medium">Config</span>
        </Link>
      </nav>

      <style jsx>{`
        .pulse-ring {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
      `}</style>
    </div>
  );
};

export default Operator;