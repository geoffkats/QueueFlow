import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNavBar from './shared/BottomNavBar';
import { queueService } from '../firebase/queueService';
import { smsService } from '../services/smsService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    serviceType: '',
    priority: 'normal'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add user to Firebase queue
      const userId = await queueService.joinQueue(formData);
      
      // Store user ID in localStorage for queue status page
      localStorage.setItem('queueUserId', userId);
      localStorage.setItem('userData', JSON.stringify(formData));
      
      // Get queue position for success message
      const positionData = await queueService.getQueuePosition(userId);
      setQueuePosition(positionData);
      
      // Send SMS confirmation if phone number provided
      if (formData.phoneNumber && smsService.validatePhoneNumber(formData.phoneNumber)) {
        try {
          await smsService.sendJoinConfirmation(
            formData.phoneNumber,
            positionData.position,
            positionData.estimatedWaitTime,
            formData.serviceType
          );
          console.log('SMS confirmation sent successfully');
        } catch (smsError) {
          console.error('SMS sending failed:', smsError);
          // Don't block the user flow if SMS fails
        }
      }
      
      // Show success message with options
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error joining queue:', error);
      alert('Failed to join queue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen flex flex-col items-center">
      {/* TopAppBar */}
      <header className="w-full top-0 px-6 py-4 flex flex-col items-center justify-center w-full max-w-md mx-auto bg-[#f7f9fb] dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#191c1e] dark:text-white tracking-tight font-headline">SmartQueue</span>
        </div>
        <p className="text-on-surface-variant font-body text-sm mt-1">Skip the line, save time</p>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-md px-6 py-8 pb-32">
        {showSuccess ? (
          /* Success Modal */
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
              </div>
              <h1 className="font-headline text-2xl font-bold text-on-surface">Successfully Joined Queue!</h1>
              <p className="text-on-surface-variant">You are now #{queuePosition?.position} in line</p>
            </div>

            <div className="bg-surface-container-lowest rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Your Position:</span>
                <span className="font-bold text-primary text-xl">#{queuePosition?.position}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant">Estimated Wait:</span>
                <span className="font-bold text-on-surface">{queuePosition?.estimatedWaitTime} minutes</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/queue-status')}
                className="w-full bg-primary text-on-primary font-headline font-bold py-4 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">visibility</span>
                Track My Position
              </button>
              
              <button 
                onClick={() => navigate('/display')}
                className="w-full bg-surface-container text-on-surface font-headline font-bold py-4 rounded-lg transition-all border border-outline-variant flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">tv</span>
                View Waiting Room Display
              </button>
              
              <button 
                onClick={() => setShowSuccess(false)}
                className="w-full text-on-surface-variant font-medium py-2 text-center"
              >
                Join Another Queue
              </button>
            </div>

            <div className="bg-surface-container-low rounded-lg p-4">
              <h3 className="font-medium text-on-surface mb-2">What's Next?</h3>
              <ul className="text-sm text-on-surface-variant space-y-1">
                <li>• You'll get SMS updates about your position</li>
                <li>• Visit the waiting room or stay nearby</li>
                <li>• We'll notify you when it's your turn</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Original Form */
          <>
            {/* Hero Decorative Element */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-8 shadow-sm">
              <img 
                alt="Modern clean office lobby with soft morning light" 
                className="w-full h-full object-cover opacity-90" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPhpMBs-dMLGMvGuHzB1aNTYIVCjIoxepybkSGRpEoRxWPcjKHvnYeXPN2dSK7ebaa_KhMxHnfFJfFNEbwaHk8K6nd6Sb3mJ2-CgGo4i406L2YVEKtMBtOF2bVfWM5gmoHukmB-xyl-8pfHno3C4BfHOLSxlknOg-5w5Il96jBFu036NO3BK1sofGdcuq25616F9Byi82KkU7Og21YPZUkhWFBNi9y8V--RTzn9Oa6s4Xb9DCiY12kl_WfVD8GIoFNTaHKrvsfkhWf"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>

            {/* Join Queue Card */}
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_40px_rgba(70,72,212,0.06)]">
              <h1 className="font-headline text-on-surface text-2xl font-bold mb-6">Join the Queue</h1>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                      person
                    </span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline/50" 
                      placeholder="Enter your name" 
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                      phone
                    </span>
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all text-on-surface placeholder:text-outline/50" 
                      placeholder="+256 700 123 456" 
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-on-surface-variant px-1">
                    Get SMS updates about your queue position
                  </p>
                </div>

                {/* Service Type Dropdown */}
                <div className="space-y-2">
                  <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1">
                    Service Type
                  </label>
                  <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant group-focus-within:text-primary transition-colors">
                      business
                    </span>
                    <select 
                      className="w-full pl-12 pr-10 py-4 bg-surface-container-low border-none rounded-md focus:ring-2 focus:ring-primary/30 focus:bg-surface-container-lowest transition-all text-on-surface appearance-none"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      required
                    >
                      <option disabled value="">Select location</option>
                      <option value="hospital">Hospital Care</option>
                      <option value="bank">Financial Center</option>
                      <option value="office">Public Office</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Priority Level Radio Buttons */}
                <div className="space-y-3">
                  <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant px-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">flag</span> 
                    Priority Level
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'normal', label: 'Normal' },
                      { value: 'senior', label: 'Senior / Disability' },
                      { value: 'emergency', label: 'Emergency' }
                    ].map((option) => (
                      <label key={option.value} className="relative flex items-center p-4 rounded-md bg-surface-container-low border border-transparent cursor-pointer hover:bg-surface-container-high transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/20">
                        <input 
                          className="w-5 h-5 text-primary border-outline-variant focus:ring-primary" 
                          name="priority" 
                          type="radio" 
                          value={option.value}
                          checked={formData.priority === option.value}
                          onChange={handleInputChange}
                        />
                        <span className="ml-3 font-body font-medium text-on-surface">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Primary Action */}
                <div className="pt-4">
                  <button 
                    className={`w-full bg-primary text-on-primary font-headline font-bold py-5 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                    }`}
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Joining Queue...' : 'Join Queue'}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                  <p className="text-center text-on-surface-variant text-xs mt-6 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    You will receive your queue position instantly
                  </p>
                </div>
              </form>
            </div>

            {/* Live Status Pulse Section */}
            <div className="mt-8 flex items-center justify-center gap-3 py-4 px-6 bg-surface-container-low rounded-full w-fit mx-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-on-surface-variant font-label text-[10px] uppercase tracking-widest font-bold">Live Queue Status</span>
            </div>
          </>
        )}
      </main>

      <BottomNavBar activeTab="tickets" />
    </div>
  );
};

export default Login;