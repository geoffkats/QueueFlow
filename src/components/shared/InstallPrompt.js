import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallButton(true);
    };

    // Listen for the app being installed
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallButton(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response to the install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-lg">download</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">Install QueueFlow</h3>
            <p className="text-xs text-gray-600 mt-1">
              Add to your home screen for quick access to queue services
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleInstallClick}
                className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Install App
              </button>
              <button
                onClick={() => setShowInstallButton(false)}
                className="text-gray-500 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowInstallButton(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-gray-400 text-sm">close</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;