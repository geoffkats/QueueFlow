import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const DevNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [buttonPosition, setButtonPosition] = useState({ x: window.innerWidth - 60, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const location = useLocation();

  const navItems = [
    { path: '/demo', label: '🎯 DEMO MODE', description: 'Feature showcase', highlight: true },
    { path: '/', label: 'Customer Portal', description: 'Join queue form' },
    { path: '/queue-status', label: 'Queue Status', description: 'Real-time position' },
    { path: '/admin', label: 'Admin Dashboard', description: 'Manage queue' },
    { path: '/operator', label: 'Operator Panel', description: 'Service control' },
    { path: '/operator-history', label: 'Service History', description: 'Performance analytics' },
    { path: '/display', label: 'Professional TV Display', description: 'Enhanced waiting room view' },
    { path: '/tv-display', label: 'Simple TV Display', description: 'Basic waiting room screen' }
  ];

  // Handle mouse down on floating button
  const handleButtonMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
  };

  // Handle mouse move for dragging button
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setHasDragged(true); // Mark that we've moved
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        // Keep button within viewport bounds
        const buttonSize = 44; // button width/height
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        
        setButtonPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset hasDragged after a short delay to allow click handler to check it
      setTimeout(() => setHasDragged(false), 10);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  // Handle button click (only if not dragging)
  const handleButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only open modal if we haven't dragged
    if (!hasDragged && !isDragging) {
      if (!isOpen) {
        // Position panel near the button
        const panelWidth = 320;
        const panelHeight = 400;
        let panelX = buttonPosition.x - panelWidth + 44; // Align right edge with button
        let panelY = buttonPosition.y + 50; // Below button
        
        // Keep panel within viewport
        panelX = Math.max(10, Math.min(panelX, window.innerWidth - panelWidth - 10));
        panelY = Math.max(10, Math.min(panelY, window.innerHeight - panelHeight - 10));
        
        setPanelPosition({ x: panelX, y: panelY });
      }
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Draggable Floating Navigation Button */}
      <button
        ref={buttonRef}
        onMouseDown={handleButtonMouseDown}
        onClick={handleButtonClick}
        className={`fixed z-[100] bg-white border border-gray-200 text-gray-700 p-2.5 rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-50 select-none transition-all duration-150 ${
          isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
        }`}
        style={{
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
          transition: isDragging ? 'none' : 'all 0.15s ease-out',
        }}
        title={isDragging ? "Dragging..." : "Navigation Menu (Drag to move)"}
      >
        <span className="material-symbols-outlined text-lg pointer-events-none">
          {isOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Navigation Panel */}
      {isOpen && (
        <>
          {/* Background overlay */}
          <div className="fixed inset-0 bg-black/20 z-[90]" onClick={() => setIsOpen(false)} />
          
          {/* Panel */}
          <div
            ref={panelRef}
            className="fixed z-[95] bg-white rounded-lg shadow-2xl border border-gray-200"
            style={{
              left: `${panelPosition.x}px`,
              top: `${panelPosition.y}px`,
              width: '320px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">Navigation</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-500">close</span>
              </button>
            </div>
            
            {/* Navigation content */}
            <div className="p-4">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`block p-3 rounded-lg transition-all ${
                      item.highlight
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold shadow-lg hover:shadow-xl'
                        : location.pathname === item.path
                        ? 'bg-primary/10 border-l-4 border-primary text-primary'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs mt-0.5 ${item.highlight ? 'text-blue-100' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="font-medium">Quick Start:</div>
                  <div>1. Customer Portal → Join Queue</div>
                  <div>2. Admin Dashboard → Manage Queue</div>
                  <div>3. Operator Panel → Serve Clients</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DevNavigation;