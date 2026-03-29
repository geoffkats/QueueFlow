import React, { useState, useEffect } from 'react';
import { queueService } from '../firebase/queueService';
import LanguageToggle from './shared/LanguageToggle';
import { useLanguage } from '../hooks/useLanguage';

const DemoMode = () => {
  const { t } = useLanguage();
  const [activeDemo, setActiveDemo] = useState('triage');
  const [demoQueue, setDemoQueue] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [etaDemo, setEtaDemo] = useState({ position: 5, eta: 25, confidence: 'high' });
  const [priorityRequests, setPriorityRequests] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const generateDemoQueue = () => {
    return [
      { id: 1, name: 'Nakato Grace', priority: 'normal', waitTime: 45, priorityScore: 35, ageCategory: 'regular', specialNeeds: [] },
      { id: 2, name: 'Musoke David', priority: 'senior', waitTime: 30, priorityScore: 72, ageCategory: '65+', specialNeeds: ['wheelchair'] },
      { id: 3, name: 'Namukasa Sarah', priority: 'emergency', waitTime: 5, priorityScore: 95, ageCategory: 'regular', specialNeeds: ['medical'] },
      { id: 4, name: 'Okello Patrick', priority: 'normal', waitTime: 60, priorityScore: 42, ageCategory: 'regular', specialNeeds: [] },
      { id: 5, name: 'Nabirye Agnes', priority: 'senior', waitTime: 25, priorityScore: 68, ageCategory: '65+', specialNeeds: [] },
      { id: 6, name: 'Kato Moses', priority: 'normal', waitTime: 75, priorityScore: 48, ageCategory: 'pregnant', specialNeeds: [] },
    ];
  };

  useEffect(() => {
    setDemoQueue(generateDemoQueue());
    const unsubscribe = queueService.subscribeToPriorityRequests((requests) => {
      setPriorityRequests(requests);
    });
    return () => unsubscribe();
  }, []);

  const runTriageAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const sorted = [...demoQueue].sort((a, b) => b.priorityScore - a.priorityScore);
      setDemoQueue(sorted);
      setIsAnimating(false);
    }, 1000);
  };

  const runAntiStarvationDemo = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const updated = demoQueue.map(person => {
        if (person.priority === 'normal' && person.waitTime > 60) {
          return { ...person, priorityScore: person.priorityScore + 10, waitTime: person.waitTime + 15 };
        }
        return person;
      });
      setDemoQueue(updated.sort((a, b) => b.priorityScore - a.priorityScore));
      setIsAnimating(false);
    }, 1000);
  };

  const simulateETAUpdate = () => {
    setIsAnimating(true);
    let countdown = etaDemo.position;
    const interval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        setIsAnimating(false);
        return;
      }
      setEtaDemo(prev => ({
        ...prev,
        position: countdown,
        eta: countdown * 5
      }));
    }, 800);
  };

  const handleApprove = async (requestId, userId, requestType) => {
    try {
      await queueService.processPriorityRequest(
        requestId,
        'STAFF-001',
        'approved',
        'Verified by staff'
      );
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleDeny = async (requestId) => {
    try {
      await queueService.processPriorityRequest(
        requestId,
        'STAFF-001',
        'denied',
        'Unable to verify'
      );
    } catch (error) {
      console.error('Denial failed:', error);
    }
  };

  const handleRequestDocs = async (requestId) => {
    try {
      await queueService.processPriorityRequest(
        requestId,
        'STAFF-001',
        'request_documentation',
        'Please show ID or medical documents to nearby staff'
      );
    } catch (error) {
      console.error('Request docs failed:', error);
    }
  };

  const getPriorityBadge = (priority) => {
    if (isDarkMode) {
      const styles = {
        emergency: 'bg-red-500/10 text-red-400 border border-red-500/30',
        senior: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        normal: 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
      };
      return styles[priority] || styles.normal;
    } else {
      const styles = {
        emergency: 'bg-red-100 text-red-700 border border-red-300',
        senior: 'bg-amber-100 text-amber-700 border border-amber-300',
        normal: 'bg-blue-100 text-blue-700 border border-blue-300'
      };
      return styles[priority] || styles.normal;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-blue-400';
  };

  // Theme-aware class helpers
  const cardBg = isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-white/60' : 'text-gray-600';
  const textTertiary = isDarkMode ? 'text-white/40' : 'text-gray-400';
  const hoverBg = isDarkMode ? 'hover:bg-white/[0.07]' : 'hover:bg-gray-50';
  const btnPrimary = isDarkMode ? 'bg-white text-black hover:bg-white/90' : 'bg-gray-900 text-white hover:bg-gray-800';
  const btnSecondary = isDarkMode ? 'bg-white/10 hover:bg-white/20 border-white/10' : 'bg-gray-100 hover:bg-gray-200 border-gray-300';

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-[#0a0a0f] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`border-b ${isDarkMode ? 'border-white/5 bg-gradient-to-b from-white/5 to-transparent' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>QueueFlow</span>
                <span className={isDarkMode ? 'text-white/40' : 'text-gray-400'}> / Demo</span>
              </h1>
              <p className={isDarkMode ? 'text-white/60' : 'text-gray-600'}>Algorithmic Innovation Showcase</p>
            </div>
            <div className="flex items-center gap-6">
              {/* Language Toggle */}
              <LanguageToggle className={isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} />
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="material-symbols-outlined text-xl">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
              <div className="text-right">
                <div className={`text-sm mb-1 ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>Monthly Cost</div>
                <div className="text-3xl font-bold text-emerald-500">$0</div>
                <div className={`text-xs ${isDarkMode ? 'text-white/40' : 'text-gray-500'}`}>vs $2,000 traditional</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Tabs */}
      <div className={`border-b ${isDarkMode ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'triage', label: 'Triage Algorithm', icon: '🧮' },
              { id: 'eta', label: 'Live ETA Sync', icon: '⚡' },
              { id: 'priority', label: 'Priority Approval', icon: '✋', badge: priorityRequests.length },
              { id: 'realtime', label: 'Real-time Updates', icon: '🔄' },
              { id: 'cost', label: 'Cost Comparison', icon: '💰' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveDemo(tab.id)}
                className={`px-6 py-4 font-medium transition-all relative ${
                  activeDemo === tab.id
                    ? isDarkMode ? 'text-white' : 'text-gray-900'
                    : isDarkMode ? 'text-white/40 hover:text-white/60' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                {tab.badge > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
                {activeDemo === tab.id && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDarkMode ? 'bg-white' : 'bg-gray-900'}`}></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Triage Algorithm */}
        {activeDemo === 'triage' && (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-2xl p-8 border`}>
              <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>Mathematical Triage Algorithm</h2>
              <p className={`${textSecondary} mb-8 font-mono text-sm`}>
                Score = (Emergency × 40) + (Age × 30) + (Wait × 20) + (Needs × 10)
              </p>
              
              <div className="flex gap-3 mb-8">
                <button
                  onClick={runTriageAnimation}
                  disabled={isAnimating}
                  className={`px-5 py-2.5 ${btnPrimary} rounded-lg font-medium disabled:opacity-50 transition-all`}
                >
                  Run Triage Sort
                </button>
                <button
                  onClick={runAntiStarvationDemo}
                  disabled={isAnimating}
                  className={`px-5 py-2.5 ${btnSecondary} rounded-lg font-medium disabled:opacity-50 transition-all border`}
                >
                  Apply Anti-Starvation
                </button>
                <button
                  onClick={() => setDemoQueue(generateDemoQueue())}
                  className={`px-5 py-2.5 ${isDarkMode ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'} rounded-lg font-medium transition-all`}
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3">
                {demoQueue.map((person, index) => (
                  <div
                    key={person.id}
                    className={`${cardBg} rounded-xl p-6 border ${hoverBg} transition-all duration-500 ${
                      isAnimating ? 'opacity-50' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`text-3xl font-bold ${isDarkMode ? 'text-white/20' : 'text-gray-300'} w-12`}>#{index + 1}</div>
                        <div>
                          <div className={`text-lg font-semibold mb-2 ${textPrimary}`}>{person.name}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wide ${getPriorityBadge(person.priority)}`}>
                              {person.priority}
                            </span>
                            <span className={`text-sm ${textTertiary}`}>
                              {person.ageCategory}
                            </span>
                            <span className={`text-sm ${textTertiary}`}>
                              • {person.waitTime}min wait
                            </span>
                            {person.specialNeeds.length > 0 && (
                              <span className="text-sm text-purple-400">
                                • {person.specialNeeds.join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${textTertiary} mb-1`}>Score</div>
                        <div className={`text-3xl font-bold ${getScoreColor(person.priorityScore)}`}>
                          {person.priorityScore}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-8 p-5 ${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-xl`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'} mb-3`}>Algorithm Features</h3>
                <div className={`grid grid-cols-2 gap-3 text-sm ${textSecondary}`}>
                  <div>✓ Emergency {'>'} Senior {'>'} Normal hierarchy</div>
                  <div>✓ Anti-starvation boost every 15min</div>
                  <div>✓ Auto-promotion after 60min wait</div>
                  <div>✓ Max 3 high-priority before 1 normal</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live ETA Sync */}
        {activeDemo === 'eta' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Customer View</h2>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-10 text-center">
                <div className="text-7xl font-bold mb-3">#{etaDemo.position}</div>
                <div className="text-xl text-white/80 mb-8">Your Position</div>
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6">
                  <div className="text-sm text-white/60 mb-2">Estimated Wait</div>
                  <div className="text-5xl font-bold mb-4">{etaDemo.eta}<span className="text-2xl text-white/60 ml-2">min</span></div>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
                    etaDemo.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-300' :
                    etaDemo.confidence === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {etaDemo.confidence === 'high' ? '✓ High Confidence' :
                     etaDemo.confidence === 'medium' ? '~ Medium Confidence' :
                     '⋯ Learning'}
                  </span>
                </div>
                <div className="text-sm text-white/60">
                  Updates live when staff serves next customer
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <h2 className="text-2xl font-bold mb-6">Staff Action</h2>
              <button
                onClick={simulateETAUpdate}
                disabled={isAnimating}
                className="w-full px-8 py-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-xl disabled:opacity-50 transition-all mb-6"
              >
                Call Next Customer
              </button>
              
              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                <h3 className="font-semibold text-emerald-400 mb-4">Live Synchronization Flow</h3>
                <div className="space-y-3 text-sm text-white/60">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">1.</span>
                    <span>Staff clicks "Next Customer"</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">2.</span>
                    <span>Firebase updates queue in real-time</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">3.</span>
                    <span>All customer screens update instantly</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 mt-0.5">4.</span>
                    <span>ETA recalculated with latest data</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
                <h3 className="font-semibold text-purple-400 mb-2">ETA Formula</h3>
                <code className="text-sm text-white/60 block mb-3">
                  ETA = Position × Avg_Service_Time
                </code>
                <div className="text-xs text-white/40">
                  Confidence: {etaDemo.confidence === 'high' ? '50+' : etaDemo.confidence === 'medium' ? '10-50' : '<10'} transactions
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priority Approval */}
        {activeDemo === 'priority' && (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-3">Staff Priority Approval</h2>
            <p className="text-white/60 mb-8">
              Customers request priority review. Staff verifies and approves/denies with full audit trail.
            </p>

            {priorityRequests.length > 0 ? (
              <div className="space-y-4">
                {priorityRequests.map((request) => (
                  <div key={request.id} className="bg-white/5 rounded-xl p-6 border border-amber-500/20">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className="text-xl font-semibold mb-1">{request.customerName}</div>
                        <div className="text-sm text-white/40">Ticket: {request.currentTicketNumber}</div>
                      </div>
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-sm font-medium uppercase">
                        {request.requestType}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                      <div>
                        <div className="text-white/40 mb-1">Location</div>
                        <div className="font-medium">{request.customerLocation}</div>
                      </div>
                      <div>
                        <div className="text-white/40 mb-1">Urgency</div>
                        <div className="font-medium">{request.urgencyLevel}/10</div>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="text-white/40 text-sm mb-2">Reason</div>
                      <div className="text-white/80">{request.reason}</div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleApprove(request.id, request.userId, request.requestType)}
                        className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleDeny(request.id)}
                        className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-all"
                      >
                        Deny
                      </button>
                      <button 
                        onClick={() => handleRequestDocs(request.id)}
                        className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all border border-white/10"
                      >
                        Request Docs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-16 text-center border border-white/10">
                <div className="text-5xl mb-4">✓</div>
                <div className="text-xl font-semibold text-white/40 mb-2">No Pending Requests</div>
                <div className="text-white/30">Priority requests will appear here for staff review</div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                <div className="text-sm font-medium text-emerald-400 mb-1">Accountability</div>
                <div className="text-xs text-white/40">Staff ID logged for every decision</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                <div className="text-sm font-medium text-blue-400 mb-1">Analytics</div>
                <div className="text-xs text-white/40">Track approval rates & response times</div>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
                <div className="text-sm font-medium text-purple-400 mb-1">Real-time</div>
                <div className="text-xs text-white/40">Customer notified instantly</div>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Updates Demo */}
        {activeDemo === 'realtime' && (
          <div className="space-y-6">
            <div className={`${cardBg} rounded-2xl p-8 border`}>
              <h2 className={`text-2xl font-bold mb-3 ${textPrimary}`}>Real-time Synchronization Flow</h2>
              <p className={`${textSecondary} mb-8`}>
                Watch how priority approval updates propagate instantly across all screens via Firebase listeners
              </p>

              {/* Flow Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Step 1: Customer Request */}
                <div className={`${cardBg} rounded-xl p-6 border`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>1</span>
                    </div>
                    <h3 className={`font-bold ${textPrimary}`}>Customer Submits</h3>
                  </div>
                  <div className={`text-sm ${textSecondary} space-y-2`}>
                    <div>• Nakato Grace clicks "Request Priority"</div>
                    <div>• Form: Senior citizen, 70 years old</div>
                    <div>• Firebase writes to priorityRequests</div>
                    <div className="text-emerald-500 font-semibold">⚡ {'< 500ms'}</div>
                  </div>
                </div>

                {/* Step 2: Staff Sees */}
                <div className={`${cardBg} rounded-xl p-6 border`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>2</span>
                    </div>
                    <h3 className={`font-bold ${textPrimary}`}>Staff Notified</h3>
                  </div>
                  <div className={`text-sm ${textSecondary} space-y-2`}>
                    <div>• subscribeToPriorityRequests() fires</div>
                    <div>• Red badge appears in header</div>
                    <div>• Request shows with all details</div>
                    <div className="text-emerald-500 font-semibold">⚡ {'< 1 second'}</div>
                  </div>
                </div>

                {/* Step 3: Approval */}
                <div className={`${cardBg} rounded-xl p-6 border`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>3</span>
                    </div>
                    <h3 className={`font-bold ${textPrimary}`}>Staff Approves</h3>
                  </div>
                  <div className={`text-sm ${textSecondary} space-y-2`}>
                    <div>• processPriorityRequest() runs</div>
                    <div>• updateUserPriority() auto-calls</div>
                    <div>• Priority score recalculated</div>
                    <div className="text-emerald-500 font-semibold">⚡ Instant</div>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div className={`${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-6 mb-6`}>
                <h3 className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'} mb-4`}>
                  🔄 Automatic Cascade (All Happen Simultaneously)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`${textSecondary} space-y-2 text-sm`}>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>Queue Reorders:</strong> subscribeToQueue() fires on all screens</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>Position Updates:</strong> Nakato moves from #12 → #4</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>TV Display:</strong> Shows updated queue order</span>
                    </div>
                  </div>
                  <div className={`${textSecondary} space-y-2 text-sm`}>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>Customer Screen:</strong> Success notification appears</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>Priority Badge:</strong> Shows "Senior" status</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500">→</span>
                      <span><strong>Operator View:</strong> Nakato now in priority queue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Integration */}
              <div className={`${cardBg} rounded-xl p-6 border`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">💬</span>
                  <h3 className={`font-bold text-lg ${textPrimary}`}>Zero-Budget WhatsApp Notification</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className={`font-semibold ${textPrimary} mb-3`}>Staff Action</h4>
                    <div className={`${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} rounded-lg p-4 mb-3`}>
                      <button className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">check_circle</span>
                        Approve + WhatsApp
                      </button>
                    </div>
                    <div className={`text-sm ${textSecondary} space-y-2`}>
                      <div>1. Staff clicks "Approve + WhatsApp"</div>
                      <div>2. Priority updates in Firebase</div>
                      <div>3. WhatsApp opens with pre-filled message</div>
                      <div>4. Staff clicks Send (1 second)</div>
                    </div>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${textPrimary} mb-3`}>Message Preview</h4>
                    <div className={`${isDarkMode ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'} border rounded-lg p-4`}>
                      <div className={`text-sm ${textSecondary} whitespace-pre-line`}>
                        {`🎉 Great news Nakato Grace!

Your priority request has been APPROVED!

✓ New Priority: SENIOR
✓ New Position: #4

You will be served ahead of regular customers. Please stay nearby - we'll call you soon!

- SmartQueue Team`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className={`${isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{'< 500ms'}</div>
                  <div className={`text-xs ${textTertiary} mt-1`}>Request Submit</div>
                </div>
                <div className={`${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{'< 1s'}</div>
                  <div className={`text-xs ${textTertiary} mt-1`}>Staff Notification</div>
                </div>
                <div className={`${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Instant</div>
                  <div className={`text-xs ${textTertiary} mt-1`}>Queue Reorder</div>
                </div>
                <div className={`${isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-200'} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>$0</div>
                  <div className={`text-xs ${textTertiary} mt-1`}>Monthly Cost</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cost Comparison */}
        {activeDemo === 'cost' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Traditional */}
              <div className="bg-white/5 rounded-2xl p-8 border border-red-500/20">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-3">🏢</div>
                  <h2 className="text-2xl font-bold text-red-400">Traditional System</h2>
                </div>
                
                <div className="space-y-3 mb-8">
                  {[
                    { label: 'SMS Gateway', cost: '$800' },
                    { label: 'Queue Software License', cost: '$600' },
                    { label: 'Hardware (Displays, Printers)', cost: '$400' },
                    { label: 'Support & Maintenance', cost: '$200' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-white/60">{item.label}</span>
                      <span className="font-semibold text-red-400">{item.cost}/mo</span>
                    </div>
                  ))}
                </div>

                <div className="bg-red-500/10 rounded-xl p-6 text-center border border-red-500/20 mb-6">
                  <div className="text-sm text-red-400 mb-2">Total Monthly Cost</div>
                  <div className="text-5xl font-bold text-red-400">$2,000</div>
                  <div className="text-sm text-white/40 mt-2">$24,000/year</div>
                </div>

                <div className="space-y-2 text-sm text-white/40">
                  {['Basic FIFO queue only', 'No priority algorithm', 'Static ETA estimates', 'Expensive SMS per message'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* QueueFlow */}
              <div className="bg-white/5 rounded-2xl p-8 border border-emerald-500/20">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-3">🚀</div>
                  <h2 className="text-2xl font-bold text-emerald-400">QueueFlow</h2>
                </div>
                
                <div className="space-y-3 mb-8">
                  {[
                    { label: 'Firebase (Free Tier)', cost: '$0' },
                    { label: 'WhatsApp Click-to-Chat', cost: '$0' },
                    { label: 'Web Push Notifications', cost: '$0' },
                    { label: 'React Web App', cost: '$0' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-white/60">{item.label}</span>
                      <span className="font-semibold text-emerald-400">{item.cost}/mo</span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-500/10 rounded-xl p-6 text-center border border-emerald-500/20 mb-6">
                  <div className="text-sm text-emerald-400 mb-2">Total Monthly Cost</div>
                  <div className="text-5xl font-bold text-emerald-400">$0</div>
                  <div className="text-sm text-white/40 mt-2">100% Free Forever</div>
                </div>

                <div className="space-y-2 text-sm text-white/60">
                  {[
                    'Mathematical triage algorithm',
                    'Anti-starvation fairness',
                    'Live ETA with confidence levels',
                    'Staff priority approval system',
                    'Real-time synchronization',
                    'Analytics & heat maps'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 rounded-2xl p-10 text-center">
              <div className="text-6xl font-bold mb-3">$24,000</div>
              <div className="text-2xl font-semibold mb-2">Annual Savings</div>
              <div className="text-lg text-white/80">
                Zero-budget innovation with superior algorithmic features
              </div>
            </div>

            {/* Innovation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '🧮', title: 'Algorithmic Brain', desc: 'Mathematical triage with weighted priority scoring beats simple FIFO', color: 'blue' },
                { icon: '⚡', title: 'Real-time Sync', desc: 'Firebase listeners provide instant updates across all devices', color: 'purple' },
                { icon: '🌍', title: 'Zero Budget', desc: 'Free tier services + clever engineering = enterprise features at $0', color: 'emerald' }
              ].map((item, i) => (
                <div key={i} className={`bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-xl p-6`}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className={`font-semibold text-${item.color}-400 mb-2`}>{item.title}</h3>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoMode;
