import React, { useEffect, useState } from 'react';

const LiveChart = ({ data, height = 200 }) => {
  const [animatedData, setAnimatedData] = useState(data.map(() => 0));

  useEffect(() => {
    // Animate chart bars when data changes
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 100);

    return () => clearTimeout(timer);
  }, [data]);

  const maxValue = Math.max(...data, 1);
  const currentHour = new Date().getHours();

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4648d4" stopOpacity="0.3"></stop>
            <stop offset="100%" stopColor="#4648d4" stopOpacity="0.1"></stop>
          </linearGradient>
        </defs>
        
        {/* Grid Lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line 
            key={i}
            stroke="#eceef0" 
            strokeWidth="1" 
            x1="0" 
            x2="1000" 
            y1={40 * i} 
            y2={40 * i}
          />
        ))}
        
        {/* Data Bars */}
        {animatedData.map((value, index) => {
          const barWidth = 1000 / animatedData.length;
          const barHeight = (value / maxValue) * 160;
          const x = index * barWidth + barWidth * 0.1;
          const y = 200 - barHeight - 20;
          const isCurrentHour = (9 + index) === currentHour;
          
          return (
            <g key={index}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth * 0.8}
                height={barHeight}
                fill={isCurrentHour ? "#4648d4" : "url(#chartGradient)"}
                className="transition-all duration-500 hover:opacity-80"
              />
              
              {/* Current hour indicator */}
              {isCurrentHour && (
                <circle
                  cx={x + barWidth * 0.4}
                  cy={y - 10}
                  r="4"
                  fill="#4648d4"
                  className="animate-pulse"
                />
              )}
              
              {/* Value label */}
              <text
                x={x + barWidth * 0.4}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-primary font-bold"
                fontSize="12"
              >
                {value}%
              </text>
            </g>
          );
        })}
        
        {/* Time labels */}
        {animatedData.map((_, index) => (
          <text
            key={index}
            x={(index * (1000 / animatedData.length)) + (1000 / animatedData.length) * 0.5}
            y="195"
            textAnchor="middle"
            className="text-xs fill-gray-500"
            fontSize="10"
          >
            {9 + index}:00
          </text>
        ))}
      </svg>
      
      {/* Live indicator */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-white/90 px-2 py-1 rounded-full">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        <span className="text-xs font-bold text-primary">LIVE</span>
      </div>
    </div>
  );
};

export default LiveChart;