import React, { useState, useEffect } from 'react';
import SideNavBar from './shared/SideNavBar';
import LiveChart from './shared/LiveChart';
import { queueService } from '../firebase/queueService';
import { whatsappHelper } from '../utils/whatsappHelper';

const Admin = () => {
  const [queueData, setQueueData] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    averageWaitTime: 0,
    activeQueue: 0,
    peakHoursData: Array(8).fill(0)
  });
  const [priorityRequests, setPriorityRequests] = useState([]);
  const [priorityStats, setPriorityStats] = useState({
    totalRequests: 0,
    approvalRate: 0,
    avgResponseTime: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showPriorityDetails, setShowPriorityDetails] = useState(null);

  useEffect(() => {
    // Set up real-time listener for all queue data
    const unsubscribeQueue = queueService.subscribeToAllQueue((allQueue) => {
      // Filter for current queue (waiting and serving)
      const currentQueue = allQueue.filter(item => 
        item.status === 'waiting' || item.status === 'serving'
      );
      
      // Sort by priority and creation time for display
      const sortedQueue = currentQueue.sort((a, b) => {
        const priorityOrder = { 'emergency': 1, 'senior': 2, 'normal': 3 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt?.seconds - b.createdAt?.seconds;
      });

      setQueueData(sortedQueue.slice(0, 10)); // Show top 10
      setIsLoading(false);
    });

    // Set up real-time listener for statistics
    const unsubscribeStats = queueService.subscribeToStats((newStats) => {
      setStats(newStats);
    });

    // Set up real-time listener for priority requests
    const unsubscribePriorityRequests = queueService.subscribeToPriorityRequests((requests) => {
      setPriorityRequests(requests);
    });

    // Load priority request statistics
    const loadPriorityStats = async () => {
      try {
        const stats = await queueService.getPriorityRequestStats(7); // Last 7 days
        setPriorityStats(stats);
      } catch (error) {
        console.error('Error loading priority stats:', error);
      }
    };

    loadPriorityStats();

    return () => {
      unsubscribeQueue();
      unsubscribeStats();
      unsubscribePriorityRequests();
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

  const handleMarkDone = async (userId) => {
    try {
      await queueService.markAsDone(userId);
    } catch (error) {
      console.error('Error marking as done:', error);
      alert('Failed to mark as done');
    }
  };

  const handlePriorityRequest = async (requestId, decision, notes = '', sendWhatsApp = false) => {
    try {
      const staffId = 'ADMIN-001'; // In a real app, this would come from authentication
      
      // Get request details before processing
      const request = priorityRequests.find(r => r.id === requestId);
      
      await queueService.processPriorityRequest(requestId, staffId, decision, notes);
      
      // Refresh priority stats
      const stats = await queueService.getPriorityRequestStats(7);
      setPriorityStats(stats);
      
      const actionText = decision === 'approved' ? 'approved' : 
                        decision === 'denied' ? 'denied' : 'processed';
      
      // If approved and WhatsApp requested, get updated position and send notification
      if (decision === 'approved' && sendWhatsApp && request) {
        try {
          // Get customer's updated queue data
          const queueData = await queueService.getQueuePosition(request.userId);
          
          // Get customer phone number from queue
          const userDoc = await queueService.getQueuePosition(request.userId);
          if (userDoc.queueData?.phoneNumber && whatsappHelper.isValidPhoneNumber(userDoc.queueData.phoneNumber)) {
            whatsappHelper.sendPriorityApprovalNotification(
              userDoc.queueData.phoneNumber,
              request.customerName,
              request.requestType,
              queueData.position
            );
          }
        } catch (error) {
          console.error('Error sending WhatsApp notification:', error);
        }
      }
      
      alert(`Priority request ${actionText} successfully`);
    } catch (error) {
      console.error('Error processing priority request:', error);
      alert('Failed to process priority request');
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'bg-error-container text-on-error-container';
      case 'senior': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      default: return 'bg-emerald-100 text-emerald-800';
    }
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-surface text-on-surface flex min-h-screen">
      <SideNavBar activeTab="dashboard" />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* TopAppBar Component */}
        <header className="bg-[#f7f9fb] dark:bg-slate-950 flex justify-between items-center px-8 py-4 w-full sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[#191c1e] dark:text-slate-100">Admin Dashboard</h2>
            <span className="text-xs text-on-surface-variant font-medium">Monday, Oct 23 • 10:42 AM</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Priority Requests Counter Badge */}
            {priorityRequests.length > 0 && (
              <button 
                onClick={() => document.getElementById('priority-requests-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative px-4 py-2 bg-error/10 hover:bg-error/20 rounded-full transition-all flex items-center gap-2 group"
              >
                <span className="material-symbols-outlined text-error animate-pulse">priority_high</span>
                <span className="text-sm font-bold text-error">{priorityRequests.length} Priority Request{priorityRequests.length !== 1 ? 's' : ''}</span>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-ping"></span>
              </button>
            )}
            
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input 
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 w-64" 
                placeholder="Search operations..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-white/50 transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">calendar_today</span>
              </button>
              <button className="p-2 rounded-full hover:bg-white/50 transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">schedule</span>
              </button>
              <button className="p-2 rounded-full hover:bg-white/50 transition-colors text-on-surface-variant relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
              </button>
            </div>
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20">
              <img 
                alt="Admin Profile" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz1BUWvd0nocey_j_osgo3CNGUP6Mb5CxMK8PGj8uvn_ajtS6xyUdmyYJJvC8c5Dyvab30GGOrPmRJYTxUpFIOdlCbDfKDctKli3KDKg9OjsRSZ77RWLRmsW_TfDKWAFEFV834k95yKOjU6kipUZdyoeVazoenvSYZnxg7rPAth-hwXhgMl29zPdUj17Z8Ng-n24HuwUIQ0ezXB5_cVz7rq4Zqv-HHtMuutWWJ3vTrVZbsR0BpemrkEk2ZPToL6X4qz4ma7Rh9emwm"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <section className="p-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Stat Card 1 */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Total Clients</p>
              <h3 className="text-4xl font-extrabold text-on-surface tracking-tight mt-1">{stats.totalClients}</h3>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3"></div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary">
                  <span className="material-symbols-outlined">avg_time</span>
                </div>
                <span className="text-xs font-bold text-error bg-error-container px-2 py-1 rounded-full">+4m</span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Average Wait Time</p>
              <h3 className="text-4xl font-extrabold text-on-surface tracking-tight mt-1">{stats.averageWaitTime} <span className="text-lg font-medium text-on-surface-variant">min</span></h3>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-1/2"></div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/10 rounded-2xl text-secondary">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Now</span>
                </div>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Active Queue Count</p>
              <h3 className="text-4xl font-extrabold text-on-surface tracking-tight mt-1">{stats.activeQueue}</h3>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-3/4"></div>
              </div>
            </div>

            {/* Priority Requests Stat Card */}
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-tertiary/10 rounded-2xl text-tertiary">
                  <span className="material-symbols-outlined">priority_high</span>
                </div>
                <span className="text-xs font-bold text-tertiary bg-tertiary-container px-2 py-1 rounded-full">
                  {priorityRequests.length} Pending
                </span>
              </div>
              <p className="text-on-surface-variant text-sm font-medium">Priority Requests</p>
              <h3 className="text-4xl font-extrabold text-on-surface tracking-tight mt-1">{priorityStats.totalRequests}</h3>
              <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary" style={{ width: `${priorityStats.approvalRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* Priority Requests Alert Section */}
          {priorityRequests.length > 0 && (
            <div className="bg-tertiary-container/10 border-l-4 border-tertiary rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary text-2xl">priority_high</span>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">Priority Requests Pending</h3>
                    <p className="text-sm text-on-surface-variant">
                      {priorityRequests.length} customer{priorityRequests.length !== 1 ? 's' : ''} requesting priority review
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-on-surface-variant">Avg Response Time</p>
                  <p className="text-lg font-bold text-tertiary">{priorityStats.avgResponseTime}min</p>
                </div>
              </div>
              
              <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2">
                {priorityRequests.map((request) => (
                  <div key={request.id} className="bg-surface-container-lowest p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-tertiary">person</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-on-surface">
                          {request.customerName} - Ticket {request.currentTicketNumber}
                        </h4>
                        <p className="text-sm text-on-surface-variant">
                          {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)} priority • 
                          {request.customerLocation} • {formatTimeAgo(request.createdAt)}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-on-surface-variant mt-1 italic">"{request.reason}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handlePriorityRequest(request.id, 'approved', 'Approved by admin', true)}
                          className="px-4 py-2 bg-tertiary text-on-tertiary text-sm font-bold rounded-lg hover:bg-tertiary/90 transition-colors flex items-center gap-1"
                          title="Approve and send WhatsApp notification"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          Approve + WhatsApp
                        </button>
                        <button 
                          onClick={() => handlePriorityRequest(request.id, 'approved', 'Approved by admin', false)}
                          className="px-4 py-1 bg-tertiary/70 text-on-tertiary text-xs font-medium rounded hover:bg-tertiary/80 transition-colors"
                        >
                          Approve Only
                        </button>
                      </div>
                      <button 
                        onClick={() => handlePriorityRequest(request.id, 'denied', 'Insufficient documentation')}
                        className="px-4 py-2 bg-error-container text-on-error-container text-sm font-bold rounded-lg hover:bg-error-container/90 transition-colors"
                      >
                        Deny
                      </button>
                      <button 
                        onClick={() => setShowPriorityDetails(request)}
                        className="px-4 py-2 bg-surface-container text-on-surface text-sm font-bold rounded-lg hover:bg-surface-container-high transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bento Layout Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Queue Table (2/3 width) */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-surface-container flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Current Queue</h2>
                  <p className="text-sm text-on-surface-variant">Managing active service requests</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 bg-surface-container-low rounded-lg hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                  </button>
                  <button 
                    className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:scale-95 transition-transform"
                    onClick={handleCallNext}
                    disabled={isLoading || queueData.length === 0}
                  >
                    Call Next
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Service</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Priority</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading queue...
                          </div>
                        </td>
                      </tr>
                    ) : queueData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant">
                          No one in queue
                        </td>
                      </tr>
                    ) : (
                      queueData.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {getInitials(item.name)}
                              </div>
                              <span className="font-semibold text-sm">{item.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm capitalize">{item.service}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'serving' ? 'bg-primary' : 'bg-outline-variant'}`}></span>
                              <span className="text-xs font-medium capitalize">{item.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              className="text-primary hover:bg-primary/5 p-2 rounded-full transition-colors"
                              onClick={() => item.status === 'serving' ? handleMarkDone(item.id) : null}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {item.status === 'serving' ? 'check_circle' : 'play_arrow'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side Widget */}
            <div className="space-y-8">
              {/* Peak Hours Mini Chart */}
              <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-primary">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">Peak Hours</h3>
                  <span className="text-[10px] font-bold text-primary">Live Trend</span>
                </div>
                <div className="h-32 flex items-end justify-between gap-1">
                  {stats.peakHoursData.map((height, index) => (
                    <div 
                      key={index}
                      className="w-full bg-primary/20 rounded-t-sm hover:bg-primary transition-colors cursor-pointer" 
                      style={{ height: `${Math.max(height, 10)}%` }}
                      title={`${9 + index}:00 - ${height}% capacity`}
                    ></div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-medium">
                  <span>09:00</span>
                  <span>12:00</span>
                  <span>17:00</span>
                </div>
              </div>

              {/* Service Efficiency Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 transition-transform group-hover:scale-[1.7]">
                  <span className="material-symbols-outlined text-6xl">rocket_launch</span>
                </div>
                <h3 className="font-bold text-sm mb-4">Queue Load</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Waiting</span>
                    <span className="text-xs font-bold">{stats.waitingCount || 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, (stats.waitingCount || 0) * 10)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Serving</span>
                    <span className="text-xs font-bold">{stats.servingCount || 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${Math.min(100, (stats.servingCount || 0) * 20)}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Completed Today</span>
                    <span className="text-xs font-bold">{stats.completedToday || 0}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary" style={{ width: `${Math.min(100, (stats.completedToday || 0) * 5)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Chart Section */}
        <section className="bg-surface-container-lowest rounded-lg shadow-sm p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-bold">Live Queue Traffic</h2>
              <p className="text-sm text-on-surface-variant">Real-time queue activity throughout the day</p>
            </div>
            <div className="flex bg-surface-container-low p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md text-xs font-bold bg-white shadow-sm text-primary">Live</button>
              <button className="px-4 py-1.5 rounded-md text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Yesterday</button>
              <button className="px-4 py-1.5 rounded-md text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">Week</button>
            </div>
          </div>
          
          <LiveChart data={stats.peakHoursData || Array(8).fill(0)} height={250} />
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Peak Hour</p>
              <p className="text-lg font-bold text-primary">
                {stats.peakHoursData && stats.peakHoursData.length > 0 
                  ? `${stats.peakHoursData.indexOf(Math.max(...stats.peakHoursData)) + 9}:00`
                  : '--:--'
                }
              </p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Current Load</p>
              <p className="text-lg font-bold text-secondary">{stats.activeQueue} people</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-lg">
              <p className="text-xs text-on-surface-variant uppercase tracking-wider">Efficiency</p>
              <p className="text-lg font-bold text-tertiary">
                {stats.completedToday > 0 ? Math.round((stats.completedToday / (stats.completedToday + stats.activeQueue)) * 100) : 0}%
              </p>
            </div>
          </div>
        </section>

        {/* Footer Branding */}
        <footer className="mt-auto py-8 px-8 flex justify-between items-center text-on-surface-variant/50">
          <p className="text-[10px] font-bold uppercase tracking-widest">© 2023 SmartQueue Enterprise</p>
          <div className="flex gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Documentation</span>
            <span className="text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:text-primary transition-colors">Support</span>
          </div>
        </footer>
      </main>

      {/* Floating Mobile Add Action */}
      <button className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-50">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Priority Request Details Modal */}
      {showPriorityDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-on-surface">Priority Request Details</h3>
              <button 
                onClick={() => setShowPriorityDetails(null)}
                className="p-2 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-surface-container p-4 rounded-lg">
                <h4 className="font-bold text-on-surface mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-on-surface-variant">Name:</span>
                    <p className="font-semibold">{showPriorityDetails.customerName}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Ticket:</span>
                    <p className="font-semibold">{showPriorityDetails.currentTicketNumber}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Location:</span>
                    <p className="font-semibold">{showPriorityDetails.customerLocation}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Requested:</span>
                    <p className="font-semibold">{formatTimeAgo(showPriorityDetails.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="bg-surface-container p-4 rounded-lg">
                <h4 className="font-bold text-on-surface mb-3">Request Details</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-on-surface-variant">Priority Type:</span>
                    <p className="font-semibold capitalize">{showPriorityDetails.requestType}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Urgency Level:</span>
                    <p className="font-semibold">{showPriorityDetails.urgencyLevel}/10</p>
                  </div>
                  {showPriorityDetails.reason && (
                    <div>
                      <span className="text-on-surface-variant">Reason:</span>
                      <p className="font-semibold mt-1">{showPriorityDetails.reason}</p>
                    </div>
                  )}
                  {showPriorityDetails.supportingInfo && (
                    <div>
                      <span className="text-on-surface-variant">Additional Info:</span>
                      <p className="font-semibold mt-1">{showPriorityDetails.supportingInfo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    handlePriorityRequest(showPriorityDetails.id, 'approved', 'Approved after review');
                    setShowPriorityDetails(null);
                  }}
                  className="flex-1 py-3 bg-tertiary text-on-tertiary font-bold rounded-lg hover:bg-tertiary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  Approve Request
                </button>
                <button 
                  onClick={() => {
                    handlePriorityRequest(showPriorityDetails.id, 'request_documentation', 'Please show ID/medical documents to staff');
                    setShowPriorityDetails(null);
                  }}
                  className="flex-1 py-3 bg-secondary-container text-on-secondary-container font-bold rounded-lg hover:bg-secondary-container/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">description</span>
                  Request Documentation
                </button>
                <button 
                  onClick={() => {
                    handlePriorityRequest(showPriorityDetails.id, 'denied', 'Request does not meet priority criteria');
                    setShowPriorityDetails(null);
                  }}
                  className="flex-1 py-3 bg-error-container text-on-error-container font-bold rounded-lg hover:bg-error-container/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  Deny Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;