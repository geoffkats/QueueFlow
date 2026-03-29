import React, { useState, useEffect } from 'react';
import { queueService } from '../firebase/queueService';

const TVDisplay = () => {
  const [currentlyServing, setCurrentlyServing] = useState(null);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Subscribe to currently serving person
    const unsubscribeServing = queueService.subscribeToCurrentlyServing((serving) => {
      setCurrentlyServing(serving);
    });

    // Subscribe to waiting queue (next 3 people)
    const unsubscribeQueue = queueService.subscribeToQueue((waitingQueue) => {
      setUpcomingQueue(waitingQueue.slice(0, 3));
    });

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribeServing();
      unsubscribeQueue();
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-UG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'text-red-600 bg-red-100';
      case 'senior': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-6xl font-bold text-white">QueueFlow</h1>
          <p className="text-2xl text-gray-300 mt-2">Digital Queue Management System</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-white">{formatTime(currentTime)}</div>
          <div className="text-xl text-gray-300">
            {currentTime.toLocaleDateString('en-UG', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Main Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Currently Serving */}
        <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">NOW SERVING</h2>
          
          {currentlyServing ? (
            <div>
              <div className="text-8xl font-black text-blue-600 mb-6">
                #{String(currentlyServing.id).slice(-3).padStart(3, '0')}
              </div>
              <div className="text-4xl font-bold text-gray-800 mb-4">
                {currentlyServing.name}
              </div>
              <div className="text-2xl text-gray-600 mb-4">
                Service: {currentlyServing.service}
              </div>
              <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getPriorityColor(currentlyServing.priority)}`}>
                {currentlyServing.priority.toUpperCase()}
              </div>
              <div className="mt-8 text-3xl font-bold text-green-600">
                → PROCEED TO COUNTER ←
              </div>
            </div>
          ) : (
            <div>
              <div className="text-8xl font-black text-gray-400 mb-6">---</div>
              <div className="text-4xl font-bold text-gray-500">No One Being Served</div>
              <div className="text-2xl text-gray-400 mt-4">Please Wait</div>
            </div>
          )}
        </div>

        {/* Up Next */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">UP NEXT</h2>
          
          {upcomingQueue.length > 0 ? (
            <div className="space-y-6">
              {upcomingQueue.map((person, index) => (
                <div key={person.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-black text-gray-600">
                      #{String(person.id).slice(-3).padStart(3, '0')}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-800">{person.name}</div>
                      <div className="text-lg text-gray-600">{person.service}</div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${getPriorityColor(person.priority)}`}>
                    {person.priority.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl text-gray-400 mb-4">📋</div>
              <div className="text-2xl font-bold text-gray-500">No One Waiting</div>
              <div className="text-lg text-gray-400 mt-2">Queue is Empty</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Information */}
      <div className="bg-white rounded-3xl p-8 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {upcomingQueue.length}
            </div>
            <div className="text-xl text-gray-600">People Waiting</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {currentlyServing ? 'ACTIVE' : 'IDLE'}
            </div>
            <div className="text-xl text-gray-600">Service Status</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              DIGITAL
            </div>
            <div className="text-xl text-gray-600">Queue System</div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center">
        <p className="text-2xl text-gray-300">
          🔊 Listen for your ticket number • 📱 Check status on your phone • ⏰ Estimated wait times available
        </p>
      </div>
    </div>
  );
};

export default TVDisplay;