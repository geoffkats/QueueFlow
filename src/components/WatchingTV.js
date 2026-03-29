import { useState, useEffect } from 'react';
import { queueService } from '../firebase/queueService';

const WatchingTV = () => {
  const [currentlyServing, setCurrentlyServing] = useState([]);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUrl, setCurrentUrl] = useState('');
  const [stats, setStats] = useState({
    averageWait: 12,
    totalInQueue: 0
  });

  useEffect(() => {
    // Set current URL for QR code
    setCurrentUrl(window.location.origin);
    
    // Subscribe to currently serving people (multiple counters)
    const unsubscribeServing = queueService.subscribeToCurrentlyServing((serving) => {
      // For TV display, we'll show up to 3 serving clients
      setCurrentlyServing(serving ? [serving] : []);
    });

    // Subscribe to waiting queue
    const unsubscribeQueue = queueService.subscribeToQueue((waitingQueue) => {
      setUpcomingQueue(waitingQueue.slice(0, 4)); // Show next 4
      setStats(prev => ({
        ...prev,
        totalInQueue: waitingQueue.length
      }));
    });

    // Subscribe to stats for average wait time
    const unsubscribeStats = queueService.subscribeToStats((statsData) => {
      setStats(prev => ({
        ...prev,
        averageWait: Math.round(statsData.averageWaitTime) || 12
      }));
    });

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribeServing();
      unsubscribeQueue();
      unsubscribeStats();
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-UG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-UG', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getServiceIcon = (service) => {
    if (service?.toLowerCase().includes('financial') || service?.toLowerCase().includes('bank')) {
      return 'payments';
    }
    if (service?.toLowerCase().includes('document') || service?.toLowerCase().includes('id')) {
      return 'description';
    }
    if (service?.toLowerCase().includes('general') || service?.toLowerCase().includes('consultation')) {
      return 'support_agent';
    }
    if (service?.toLowerCase().includes('emergency')) {
      return 'emergency';
    }
    return 'help_center';
  };

  const getServiceCategory = (service) => {
    if (service?.toLowerCase().includes('financial') || service?.toLowerCase().includes('bank')) {
      return 'FINANCIAL SERVICES';
    }
    if (service?.toLowerCase().includes('document') || service?.toLowerCase().includes('id')) {
      return 'DOCUMENTATION';
    }
    if (service?.toLowerCase().includes('emergency')) {
      return 'EMERGENCY CARE';
    }
    return 'GENERAL INQUIRY';
  };

  const getTicketNumber = (id, index = 0) => {
    const prefixes = ['A', 'B', 'C', 'D'];
    const prefix = prefixes[index % prefixes.length];
    const number = String(id).slice(-3).padStart(3, '0');
    return `${prefix}-${number}`;
  };

  const getCounterNumber = (index = 0) => {
    return String(index + 1).padStart(2, '0');
  };

  const calculateEstimatedWait = (position) => {
    const baseWait = stats.averageWait || 12;
    return Math.max(2, Math.round(position * (baseWait / 3)));
  };

  return (
    <div className="bg-background text-on-background font-body min-h-screen overflow-y-auto flex flex-col">
      {/* Top Navigation Shell */}
      <header className="bg-slate-50/80 backdrop-blur-xl sticky top-0 w-full px-4 md:px-8 py-4 md:py-6 shadow-2xl shadow-indigo-500/10 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3 md:gap-6">
          <h1 className="font-headline font-extrabold text-xl md:text-2xl text-slate-900 tracking-tight">QueueFlow Live</h1>
          <div className="flex items-center gap-2 bg-primary/10 px-2 md:px-4 py-1 md:py-1.5 rounded-full">
            <span className="w-2 md:w-2.5 h-2 md:h-2.5 bg-primary rounded-full animate-pulse"></span>
            <span className="font-label text-[10px] md:text-xs font-semibold tracking-widest text-primary uppercase">SYSTEM LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-end">
            <span className="font-headline font-bold text-lg md:text-xl text-on-surface">{formatTime(currentTime)}</span>
            <span className="font-label text-[8px] md:text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70">
              {formatDate(currentTime)}
            </span>
          </div>
          <div className="flex gap-2 md:gap-4">
            <span className="material-symbols-outlined text-indigo-600 text-lg md:text-xl">rss_feed</span>
            <span className="material-symbols-outlined text-slate-500 hover:opacity-80 transition-all duration-300 cursor-pointer text-lg md:text-xl">settings</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 p-4 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 max-w-7xl mx-auto w-full">
        {/* Left Section: Now Serving Focus */}
        <section className="lg:col-span-8 flex flex-col gap-6 md:gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between px-2 md:px-4 gap-4">
            <div>
              <span className="font-label text-xs md:text-sm font-bold tracking-[0.15em] text-primary uppercase">Current Status</span>
              <h2 className="font-headline text-3xl md:text-5xl font-extrabold tracking-tighter text-on-surface">NOW SERVING</h2>
            </div>
            <div className="bg-surface-container-high px-4 md:px-6 py-2 md:py-3 rounded-lg flex items-center gap-2 md:gap-3 w-fit">
              <span className="material-symbols-outlined text-primary text-lg md:text-xl">group</span>
              <span className="font-headline font-bold text-sm md:text-base text-on-surface">Average Wait: {stats.averageWait} min</span>
            </div>
          </div>

          {/* Major Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 min-h-[400px]">
            {/* Primary Serving Card */}
            {currentlyServing.length > 0 ? (
              <div className="md:col-span-2 bg-surface-container-lowest p-6 md:p-10 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-primary"></div>
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
                  <div className="space-y-2">
                    <span className="font-label text-xs md:text-sm text-on-surface-variant font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm md:text-base">
                        {getServiceIcon(currentlyServing[0].service)}
                      </span>
                      {getServiceCategory(currentlyServing[0].service)}
                    </span>
                    <div className="font-headline text-6xl md:text-[10rem] font-extrabold leading-none tracking-tighter text-primary">
                      {getTicketNumber(currentlyServing[0].id, 0)}
                    </div>
                  </div>
                  <div className="bg-primary text-on-primary p-6 md:p-12 rounded-lg text-center flex flex-col items-center justify-center min-w-[180px] md:min-w-[240px]">
                    <span className="font-label text-xs opacity-80 uppercase tracking-widest mb-1">Proceed to</span>
                    <span className="font-headline text-4xl md:text-6xl font-black">{getCounterNumber(0)}</span>
                    <span className="font-body text-sm font-medium mt-1 uppercase">Counter</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 bg-surface-container-lowest p-6 md:p-10 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-outline-variant"></div>
                <div className="flex justify-center items-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="font-headline text-6xl md:text-8xl font-extrabold leading-none tracking-tighter text-outline-variant mb-4">
                      ---
                    </div>
                    <span className="font-label text-base md:text-lg text-on-surface-variant font-semibold">
                      NO ONE CURRENTLY BEING SERVED
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Cards - Show upcoming if no multiple serving */}
            {upcomingQueue.slice(0, 2).map((person, index) => (
              <div key={person.id} className="bg-surface-container-lowest p-4 md:p-8 rounded-xl relative group opacity-60">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-label text-xs text-on-surface-variant font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm md:text-base">
                        {getServiceIcon(person.service)}
                      </span>
                      {getServiceCategory(person.service)}
                    </span>
                    <div className="font-headline text-5xl md:text-8xl font-bold tracking-tighter text-on-surface">
                      {getTicketNumber(person.id, index + 1)}
                    </div>
                  </div>
                  <div className="bg-surface-container text-on-surface-variant px-4 md:px-6 py-4 md:py-8 rounded-lg text-center flex flex-col items-center">
                    <span className="font-label text-[8px] md:text-[10px] opacity-70 uppercase tracking-widest">Next</span>
                    <span className="font-headline text-2xl md:text-4xl font-extrabold text-on-surface">
                      {getCounterNumber(index + 1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Sidebar: Up Next */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-low h-full rounded-xl p-4 md:p-8 flex flex-col min-h-[500px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
              <h3 className="font-headline text-xl md:text-2xl font-bold text-on-surface">UP NEXT</h3>
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-label w-fit">
                {stats.totalInQueue} IN QUEUE
              </span>
            </div>
            
            <div className="flex-1 space-y-4">
              {upcomingQueue.length > 0 ? (
                upcomingQueue.map((person, index) => (
                  <div 
                    key={person.id} 
                    className={`bg-surface-container-lowest p-6 rounded-lg flex justify-between items-center border-l-4 border-outline-variant/30 ${
                      index > 0 ? `opacity-${100 - (index * 20)}` : ''
                    }`}
                  >
                    <div>
                      <div className="font-headline text-4xl font-extrabold text-on-surface">
                        {getTicketNumber(person.id, index)}
                      </div>
                      <span className="font-body text-xs text-on-surface-variant">
                        {getServiceCategory(person.service)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-label text-[10px] font-bold text-primary uppercase">Estimated</div>
                      <div className="font-headline text-xl font-bold text-on-surface">
                        {calculateEstimatedWait(index + 1)} MIN
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-6xl text-outline-variant mb-4 block">
                      queue
                    </span>
                    <p className="font-headline text-lg font-bold text-on-surface-variant">Queue is Empty</p>
                    <p className="font-body text-sm text-on-surface-variant mt-2">No one waiting</p>
                  </div>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-outline-variant/20">
              <div className="text-center mb-4">
                <h4 className="font-headline text-base md:text-lg font-bold text-on-surface mb-2">Join the Queue</h4>
                <p className="text-xs md:text-sm text-on-surface-variant">Scan QR code or visit on your phone</p>
              </div>
              <div className="relative w-full h-32 md:h-48 rounded-lg overflow-hidden mb-4 bg-white p-2 md:p-4 flex items-center justify-center">
                <img 
                  alt="QR Code for mobile queue access" 
                  className="w-full h-full object-contain" 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&bgcolor=ffffff&color=4648d4`}
                  onError={(e) => {
                    // Fallback to a static QR code if the API fails
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23666'%3EQR Code%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <div className="bg-surface-container-high rounded-lg p-3 md:p-4">
                <p className="font-body text-xs md:text-sm text-center text-on-surface font-medium mb-2">
                  Visit: <span className="font-mono text-primary break-all">{currentUrl}</span>
                </p>
                <p className="font-body text-[10px] md:text-xs text-center text-on-surface-variant">
                  Or scan QR code to join queue from your mobile device
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Shell (Footer with Ticker) */}
      <footer className="bg-indigo-600 w-full py-3 md:py-4 flex flex-col md:flex-row justify-between items-center px-4 md:px-12 gap-4 md:gap-0 mt-8">
        <div className="ticker-container flex-1 overflow-hidden order-2 md:order-1">
          <div className="ticker-content font-body uppercase tracking-[0.05em] text-xs md:text-sm font-semibold text-white">
            🔊 Please listen for your ticket number • 📱 Check status on your phone by scanning the QR code • ⏰ Estimated wait times are updated every 30 seconds • ℹ️ For assistance, please visit the Information Desk • 🔊 Please listen for your ticket number • 📱 Check status on your phone by scanning the QR code • ⏰ Estimated wait times are updated every 30 seconds
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-8 md:ml-12 order-1 md:order-2">
          <span className="font-body uppercase tracking-[0.05em] text-xs md:text-sm font-semibold text-white cursor-pointer hover:opacity-80 transition-all duration-300 text-center">
            Safety Protocols
          </span>
          <span className="font-body uppercase tracking-[0.05em] text-xs md:text-sm font-semibold text-white cursor-pointer hover:opacity-80 transition-all duration-300 text-center">
            Privacy Policy
          </span>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .ticker-container {
          overflow: hidden;
          white-space: nowrap;
        }
        .ticker-content {
          display: inline-block;
          padding-left: 100%;
          animation: ticker 30s linear infinite;
        }
        @keyframes ticker {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-100%, 0); }
        }
      `}</style>
    </div>
  );
};

export default WatchingTV;