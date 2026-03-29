import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './shared/BottomNavBar';
import EmptyQueueState from './shared/EmptyQueueState';
import LanguageToggle from './shared/LanguageToggle';
import { queueService } from '../firebase/queueService';
import { useLanguage } from '../hooks/useLanguage';

const QueueStatus = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [queueInfo, setQueueInfo] = useState({
    position: 0,
    totalWaiting: 0,
    estimatedWaitTime: 0,
    etaConfidence: 'learning',
    sampleSize: 0
  });
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPendingPriorityRequest, setHasPendingPriorityRequest] = useState(false);
  const [showPriorityRequestModal, setShowPriorityRequestModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState({ type: '', message: '' });
  const [priorityRequestForm, setPriorityRequestForm] = useState({
    requestType: 'senior',
    location: '',
    reason: '',
    urgencyLevel: 5
  });

  useEffect(() => {
    // Get user data from localStorage
    const userId = localStorage.getItem('queueUserId');
    const storedUserData = localStorage.getItem('userData');
    
    if (!userId || !storedUserData) {
      // If no user data, redirect to login
      navigate('/');
      return;
    }

    setUserData(JSON.parse(storedUserData));

    // Debug: Log userData to verify priority field
    const parsedUserData = JSON.parse(storedUserData);
    console.log('User Data:', parsedUserData);
    console.log('Priority:', parsedUserData.priority);

    // Check if user has pending priority request
    const checkPriorityRequestStatus = async () => {
      try {
        const hasPending = await queueService.checkUserPriorityRequestStatus(userId);
        setHasPendingPriorityRequest(hasPending);
      } catch (error) {
        console.error('Error checking priority request status:', error);
      }
    };

    checkPriorityRequestStatus();

    // Set up real-time listener for user's priority requests
    const unsubscribePriorityRequest = queueService.subscribeToPriorityRequests((allRequests) => {
      const userRequest = allRequests.find(req => req.userId === userId);
      
      // If user has a pending request, mark it
      if (userRequest && userRequest.status === 'pending') {
        setHasPendingPriorityRequest(true);
      } else {
        setHasPendingPriorityRequest(false);
      }
    });

    // Check for recently processed (approved/denied) requests
    const checkProcessedRequests = async () => {
      try {
        const history = await queueService.getUserPriorityRequestHistory(userId);
        const recentRequest = history[0]; // Most recent
        
        if (recentRequest && recentRequest.processedAt) {
          const processedTime = recentRequest.processedAt.toDate ? 
            recentRequest.processedAt.toDate().getTime() : 
            new Date(recentRequest.processedAt).getTime();
          const now = Date.now();
          const timeSinceProcessed = now - processedTime;
          
          // Show notification if processed within last 30 seconds
          if (timeSinceProcessed < 30000) {
            if (recentRequest.status === 'denied') {
              setNotificationMessage({
                type: 'error',
                message: `Your priority request was denied. Reason: ${recentRequest.notes || 'Does not meet criteria'}`
              });
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 10000);
            }
          }
        }
      } catch (error) {
        console.error('Error checking processed requests:', error);
      }
    };

    checkProcessedRequests();
    // Check every 5 seconds for updates
    const checkInterval = setInterval(checkProcessedRequests, 5000);

    // Set up real-time listener for queue updates to detect priority changes
    const unsubscribeQueueItem = queueService.subscribeToQueue(async (waitingQueue) => {
      const userInQueue = waitingQueue.find(item => item.id === userId);
      
      if (userInQueue) {
        // Check if priority has changed
        const storedData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (storedData.priority !== userInQueue.priority) {
          // Priority was updated!
          const updatedUserData = { ...storedData, priority: userInQueue.priority };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          setUserData(updatedUserData);
          
          // Show notification
          if (userInQueue.priority === 'senior' || userInQueue.priority === 'emergency') {
            setNotificationMessage({
              type: 'success',
              message: `🎉 Your priority request has been approved! You are now ${userInQueue.priority} priority.`
            });
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 8000);
          }
        }
      }
    });

    // Set up real-time listener for queue updates
    const unsubscribe = queueService.subscribeToQueue(async (waitingQueue) => {
      // Find user's position in the queue
      const userIndex = waitingQueue.findIndex(item => item.id === userId);
      
      if (userIndex === -1) {
        // User not in waiting queue anymore (might be serving or done)
        setQueueInfo({
          position: 0,
          totalWaiting: waitingQueue.length,
          estimatedWaitTime: 0,
          status: 'not-waiting'
        });
      } else {
        // Get smart estimated wait time with confidence levels
        const positionData = await queueService.getQueuePosition(userId);
        
        setQueueInfo({
          position: positionData.position,
          totalWaiting: positionData.totalWaiting,
          estimatedWaitTime: positionData.estimatedWaitTime,
          etaConfidence: positionData.etaConfidence || 'learning',
          sampleSize: positionData.sampleSize || 0,
          avgServiceTime: positionData.avgServiceTime,
          status: 'waiting'
        });
      }
    });
    
    setIsLoading(false);
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe();
      unsubscribePriorityRequest();
      unsubscribeQueueItem();
      clearInterval(checkInterval);
    };
  }, [navigate]);

  const handlePriorityRequest = async () => {
    try {
      const userId = localStorage.getItem('queueUserId');
      if (!userId) {
        alert('User session not found');
        return;
      }

      const requestData = {
        ...priorityRequestForm,
        ipAddress: 'customer-app',
        userAgent: navigator.userAgent
      };

      await queueService.requestPriorityReview(userId, requestData);
      
      setHasPendingPriorityRequest(true);
      setShowPriorityRequestModal(false);
      
      // Reset form
      setPriorityRequestForm({
        requestType: 'senior',
        location: '',
        reason: '',
        urgencyLevel: 5
      });

      alert('Priority request submitted successfully! Staff will review your request shortly.');
    } catch (error) {
      console.error('Error submitting priority request:', error);
      alert(error.message || 'Failed to submit priority request');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface-bright font-body text-on-surface min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your queue status...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-surface-bright font-body text-on-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f9fb]/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(70,72,212,0.05)]">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tighter text-[#4648d4] font-headline">SmartQueue</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageToggle className="bg-surface-container text-on-surface" />
            <button className="relative p-2 text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 duration-200">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
        {/* Welcome & Status Header */}
        <section className="space-y-1">
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">{t('yourPosition')}</h1>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full pulse-circle"></div>
            <p className="text-on-surface-variant text-sm font-medium">{t('realTimeUpdates')}</p>
          </div>
        </section>

        {/* Main Status Card */}
        <section className="relative overflow-hidden bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(70,72,212,0.08)] p-8">
          {/* Left Accent Bar */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
          
          {queueInfo.position === 0 || queueInfo.status === 'not-waiting' ? (
            <EmptyQueueState userType="customer" serviceType={userData?.serviceType || 'hospital'} />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-label text-xs font-bold uppercase tracking-[0.1em] text-primary">Live Ticket</span>
                  <h2 className="font-headline text-5xl font-extrabold tracking-tight text-on-surface">
                    {queueInfo.status === 'not-waiting' ? 'You\'re up!' : `${t('yourPosition')} #${queueInfo.position}`}
                  </h2>
                </div>
                <div className="bg-secondary-container px-4 py-1.5 rounded-full">
                  <span className="font-label text-xs font-bold uppercase tracking-wider text-on-secondary-container">
                    {queueInfo.status === 'not-waiting' ? 'Ready to Serve' : t('waiting')}
                  </span>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-on-surface-variant">Progress</span>
                  <span className="text-primary">
                    {queueInfo.totalWaiting - queueInfo.position + 1} of {queueInfo.totalWaiting} ahead of you
                  </span>
                </div>
                <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500" 
                    style={{ width: `${queueInfo.position > 0 ? ((queueInfo.totalWaiting - queueInfo.position + 1) / queueInfo.totalWaiting) * 100 : 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 bg-surface-container-low rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">schedule</span>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{t('estimatedWait')}</p>
                    <p className="text-lg font-bold text-on-surface">
                      {queueInfo.estimatedWaitTime > 0 ? `${queueInfo.estimatedWaitTime} ${t('minutes')}` : 'Ready now!'}
                    </p>
                    {queueInfo.etaConfidence && queueInfo.estimatedWaitTime > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          queueInfo.etaConfidence === 'high' ? 'bg-tertiary/10 text-tertiary' :
                          queueInfo.etaConfidence === 'medium' ? 'bg-primary/10 text-primary' :
                          'bg-surface-container text-on-surface-variant'
                        }`}>
                          {queueInfo.etaConfidence === 'high' ? '✓ High Confidence' :
                           queueInfo.etaConfidence === 'medium' ? '~ Medium Confidence' :
                           '⋯ Learning'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Priority Request Section - PROMINENT PLACEMENT */}
        {(() => {
          const shouldShow = queueInfo.position > 0 && userData?.priority === 'normal';
          console.log('Priority Request Section - Should Show:', shouldShow, {
            position: queueInfo.position,
            userPriority: userData?.priority,
            userData: userData
          });
          return shouldShow;
        })() && (
          <section className="bg-tertiary-container/10 border border-tertiary-container/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary">priority_high</span>
              </div>
              <div className="flex-1">
                <h3 className="font-headline text-lg font-bold text-on-surface mb-2">Need Priority Service?</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  If you have a medical emergency, are a senior citizen (65+), pregnant, or have a disability, 
                  you can request priority review from our staff.
                </p>
                {hasPendingPriorityRequest ? (
                  <div className="flex items-center gap-2 text-tertiary">
                    <span className="material-symbols-outlined animate-pulse">pending</span>
                    <span className="text-sm font-medium">Priority request pending staff review...</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowPriorityRequestModal(true)}
                    className="bg-tertiary text-on-tertiary font-bold py-3 px-6 rounded-lg hover:bg-tertiary/90 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">request_quote</span>
                    Request Priority Review
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Priority Status Badge - Show when priority is elevated */}
        {userData?.priority !== 'normal' && queueInfo.position > 0 && (
          <section className="bg-tertiary/10 border-2 border-tertiary rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-white">verified</span>
              </div>
              <div className="flex-1">
                <h3 className="font-headline text-lg font-bold text-on-surface mb-1">
                  ✓ Priority Status: {userData.priority.charAt(0).toUpperCase() + userData.priority.slice(1)}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Your priority request has been approved. You will be served ahead of regular customers.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Mathematical Empathy Display */}
        {queueInfo.position > 0 && queueInfo.estimatedWaitTime > 0 && (
          <section className="bg-primary-container/10 border border-primary-container/20 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="material-symbols-outlined text-primary">calculate</span>
              <div className="flex-1">
                <h3 className="font-headline text-lg font-bold text-on-surface mb-2">How We Calculate Your Wait Time</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Your estimated wait time of <span className="font-bold text-primary">{queueInfo.estimatedWaitTime} minutes</span> is calculated using:
                </p>
                <div className="mt-3 space-y-2 text-sm text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Your position: <span className="font-semibold text-on-surface">#{queueInfo.position}</span> in queue</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Average service time: <span className="font-semibold text-on-surface">{queueInfo.avgServiceTime || 5} minutes</span> per customer</span>
                  </div>
                  {queueInfo.sampleSize > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Based on <span className="font-semibold text-on-surface">{queueInfo.sampleSize}</span> recent transactions</span>
                    </div>
                  )}
                </div>
                {queueInfo.etaConfidence === 'learning' && (
                  <p className="mt-3 text-xs text-on-surface-variant italic">
                    We're still learning your service center's patterns. Estimates will become more accurate over time.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="flex gap-4">
          <button 
            onClick={() => navigate('/display')}
            className="flex-1 bg-primary text-on-primary font-headline font-bold py-4 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-primary/90"
          >
            <span className="material-symbols-outlined">tv</span>
            View Waiting Room Display
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="bg-surface-container text-on-surface font-headline font-bold py-4 px-6 rounded-lg transition-all border border-outline-variant flex items-center justify-center gap-2 hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </section>

        {/* Details Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-lg p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">local_hospital</span>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Service Type</p>
              <p className="text-lg font-bold text-on-surface leading-tight">
                {userData?.serviceType === 'hospital' ? 'Hospital Care' : 
                 userData?.serviceType === 'bank' ? 'Financial Center' : 
                 userData?.serviceType === 'office' ? 'Public Office' : 'General Service'}
              </p>
              <p className="text-sm text-on-surface-variant">
                {userData?.serviceType === 'hospital' ? 'City Central Hospital' : 
                 userData?.serviceType === 'bank' ? 'Main Branch' : 
                 'Service Center'}
              </p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-lg p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">priority_high</span>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Priority Level</p>
              <p className="text-lg font-bold text-on-surface">
                {userData?.priority === 'emergency' ? 'Emergency' : 
                 userData?.priority === 'senior' ? 'Senior/Disability' : 'Standard'}
              </p>
              <p className="text-sm text-on-surface-variant">Queue #{queueInfo.position > 0 ? `A-${queueInfo.position.toString().padStart(3, '0')}` : 'Ready'}</p>
            </div>
          </div>
        </section>

        {/* Location Context Section */}
        <section className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="p-6 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">Wait in Comfort</h3>
                <p className="text-on-surface-variant text-sm mt-1">Visit our lounge or café while you wait. We'll notify you when you're 5 minutes away.</p>
              </div>
              <button 
                onClick={() => navigate('/display')}
                className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-base flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
              >
                <span className="material-symbols-outlined">tv</span>
                View Waiting Room
              </button>
            </div>
          </div>
          <div className="relative h-48 w-full bg-surface-variant">
            <img 
              alt="Hospital Lounge" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaosZVBrRCbvR3hXrrF_0isxXu0HJnTMlHhcIEExrdP3SIuHzSjN30_uvTWU9qqQ3Df9U0gGzk4vdSqeaqAOfc5mwY7zsI4YuledDiN8mWG9gSew6uM3zdBIWnCg03L-Upc17mn1S6fh35Y20gV9k8IH0l_CccG0xMsht4Za3IAfpco-fdEilrpGLHFKq36MfUWvr0H1xx1kfnEXK9TdJQtosr4BAUScv_P3fPrr5BKwEP3xdi4MHROo8b-jbRvEUkeDsoi03Odj4p"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent"></div>
          </div>
        </section>
      </main>

      <BottomNavBar activeTab="tickets" />

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className={`${
            notificationMessage.type === 'success' ? 'bg-tertiary' : 'bg-error'
          } text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}>
            <span className="material-symbols-outlined text-2xl">
              {notificationMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <div className="flex-1">
              <p className="font-bold text-sm">{notificationMessage.message}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Priority Request Modal */}
      {showPriorityRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-xl font-bold text-on-surface">Request Priority Review</h3>
              <button 
                onClick={() => setShowPriorityRequestModal(false)}
                className="p-2 hover:bg-surface-container rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Priority Type
                </label>
                <select 
                  value={priorityRequestForm.requestType}
                  onChange={(e) => setPriorityRequestForm(prev => ({...prev, requestType: e.target.value}))}
                  className="w-full p-3 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20"
                >
                  <option value="senior">Senior Citizen (65+)</option>
                  <option value="emergency">Medical Emergency</option>
                  <option value="disability">Disability/Special Needs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Your Current Location
                </label>
                <input 
                  type="text"
                  value={priorityRequestForm.location}
                  onChange={(e) => setPriorityRequestForm(prev => ({...prev, location: e.target.value}))}
                  placeholder="e.g., Waiting Area A, QR Station 2"
                  className="w-full p-3 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Reason for Priority Request
                </label>
                <textarea 
                  value={priorityRequestForm.reason}
                  onChange={(e) => setPriorityRequestForm(prev => ({...prev, reason: e.target.value}))}
                  placeholder="Please briefly explain why you need priority service..."
                  rows={3}
                  className="w-full p-3 bg-surface-container border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">
                  Urgency Level (1-10)
                </label>
                <input 
                  type="range"
                  min="1"
                  max="10"
                  value={priorityRequestForm.urgencyLevel}
                  onChange={(e) => setPriorityRequestForm(prev => ({...prev, urgencyLevel: parseInt(e.target.value)}))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>Low (1)</span>
                  <span className="font-bold text-primary">{priorityRequestForm.urgencyLevel}</span>
                  <span>High (10)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowPriorityRequestModal(false)}
                className="flex-1 py-3 bg-surface-container text-on-surface font-bold rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePriorityRequest}
                className="flex-1 py-3 bg-tertiary text-on-tertiary font-bold rounded-lg hover:bg-tertiary/90 transition-colors"
              >
                Submit Request
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mt-4 text-center">
              Staff will review your request and notify you of their decision. 
              You can only submit one priority request per queue session.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .pulse-circle {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .4; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default QueueStatus;