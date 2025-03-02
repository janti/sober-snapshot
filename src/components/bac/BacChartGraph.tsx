
import React, { useEffect, useState } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<{ time: Date; bac: number }[]>([]);
  
  // Process data when it changes
  useEffect(() => {
    console.log("Chart data updated with", data.length, "points");
    
    if (data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Filter out zero BAC points, except keep the last one if all are zero
    const filteredData = data.filter(point => point.bac > 0);
    if (filteredData.length === 0 && data.length > 0) {
      filteredData.push(data[data.length - 1]);
    }
    
    // Ensure the data starts from now
    const now = new Date();
    const sortedData = [...filteredData].sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Always start from current time with current BAC
    if (sortedData.length > 0) {
      // Get current BAC by using the first data point or interpolating
      const currentBac = getCurrentBac(data);
      
      // Add or update the current time point
      const currentTimePointIndex = sortedData.findIndex(
        p => Math.abs(p.time.getTime() - now.getTime()) < 60000
      );
      
      if (currentTimePointIndex >= 0) {
        // Update existing point
        sortedData[currentTimePointIndex].time = new Date();
      } else {
        // Add new point at current time
        sortedData.unshift({ time: new Date(), bac: currentBac });
      }
    }
    
    setChartData(sortedData);
  }, [data]);

  // Format time for display - using hours only
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Get the current BAC by finding the closest data point to now
  const getCurrentBac = (dataPoints: { time: Date; bac: number }[]): number => {
    const now = new Date().getTime();
    
    // Find the two data points that surround the current time
    let beforePoint = null;
    let afterPoint = null;
    
    for (const point of dataPoints) {
      const pointTime = point.time.getTime();
      
      if (pointTime <= now) {
        // This point is before or at now
        if (!beforePoint || pointTime > beforePoint.time.getTime()) {
          beforePoint = point;
        }
      } else {
        // This point is after now
        if (!afterPoint || pointTime < afterPoint.time.getTime()) {
          afterPoint = point;
        }
      }
    }
    
    // If we only have points before now, use the latest one
    if (beforePoint && !afterPoint) {
      return beforePoint.bac;
    }
    
    // If we only have points after now, use the earliest one
    if (!beforePoint && afterPoint) {
      return afterPoint.bac;
    }
    
    // If we have points before and after, interpolate
    if (beforePoint && afterPoint) {
      const timeDiff = afterPoint.time.getTime() - beforePoint.time.getTime();
      const bacDiff = afterPoint.bac - beforePoint.bac;
      const ratio = (now - beforePoint.time.getTime()) / timeDiff;
      return beforePoint.bac + (bacDiff * ratio);
    }
    
    // Default to 0 if no data
    return 0;
  };

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>
    );
  }

  // Calculate max BAC for scaling (with minimum of 0.08 to ensure proper visualization)
  const maxBac = Math.max(0.08, ...chartData.map(d => d.bac * 1.2));
  
  // Get start and end times for the chart
  const now = new Date();
  const startTime = now; // Always start from now
  const endTime = chartData[chartData.length - 1].time;
  
  // Calculate total hours for the chart (with a minimum of 3 hours to avoid too narrow display)
  const totalHours = Math.max(3, (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000));
  
  // Create hour interval - aim for 4-8 marks
  let hourInterval = 1; // Default to 1 hour
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 6) {
    hourInterval = 2;
  }
  
  // Generate hour marks
  const hourMarks: Date[] = [];
  
  // Start from now (rounded to the nearest hour)
  const firstHour = new Date(now);
  firstHour.setMinutes(0, 0, 0);
  if (firstHour.getTime() < now.getTime()) {
    firstHour.setHours(firstHour.getHours() + 1);
  }
  
  // Add hour marks at regular intervals
  let currentHour = new Date(firstHour);
  // Ensure we create marks that cover the entire chart duration
  while (currentHour.getTime() <= endTime.getTime() + hourInterval * 60 * 60 * 1000) {
    hourMarks.push(new Date(currentHour));
    currentHour.setHours(currentHour.getHours() + hourInterval);
  }

  // Create BAC level marks with appropriate intervals
  const bacMarks: number[] = [];
  // Determine a nice interval based on max BAC
  let bacInterval = 0.02; // default for small values
  if (maxBac > 0.4) {
    bacInterval = 0.1;
  } else if (maxBac > 0.2) {
    bacInterval = 0.05;
  }
  
  // Generate BAC marks from 0 up to maxBac (rounded up to next interval)
  const roundedMaxBac = Math.ceil(maxBac / bacInterval) * bacInterval;
  for (let level = 0; level <= roundedMaxBac; level += bacInterval) {
    bacMarks.push(parseFloat(level.toFixed(4))); // Avoid floating point issues
  }

  // Ensure we have at least 3 BAC marks regardless of the calculated interval
  if (bacMarks.length < 3) {
    bacMarks.length = 0;
    bacInterval = maxBac / 4;
    for (let level = 0; level <= maxBac * 1.1; level += bacInterval) {
      bacMarks.push(parseFloat(level.toFixed(4))); // Avoid floating point issues
    }
  }

  // Calculate chart dimensions for proper scaling
  const chartHeight = 220; // Reduced height to prevent overflow
  const chartWidth = "100%"; // Use full width of container

  // Create a straight-line version of the data
  const straightLineData = chartData.filter(point => point.time.getTime() >= startTime.getTime());

  return (
    <div className="w-full h-[280px] relative mb-2 overflow-hidden">
      {/* Chart container */}
      <div className="absolute inset-0 border-b border-l border-border pt-2 pb-6 pr-2" style={{ height: chartHeight }}>
        {/* Horizontal grid lines and Y-axis labels */}
        {bacMarks.map((level, index) => {
          const percentY = 100 - (level / roundedMaxBac) * 100;
          
          // Skip if the position would be off-chart
          if (percentY < 0 || percentY > 100) return null;
          
          return (
            <div 
              key={`y-${index}`} 
              className="absolute w-full border-t border-border border-opacity-50 flex items-center"
              style={{ top: `${percentY}%` }}
            >
              <span className="absolute -left-8 -mt-2 text-xs text-muted-foreground whitespace-nowrap">
                {(level * 10).toFixed(1)}‰
              </span>
            </div>
          );
        })}
        
        {/* Draw legal limit lines */}
        {LEGAL_LIMITS.regular <= roundedMaxBac && (
          <div 
            className="absolute w-full border-t-2 border-dashed border-destructive border-opacity-70"
            style={{ 
              top: `${100 - (LEGAL_LIMITS.regular / roundedMaxBac) * 100}%`,
              zIndex: 5
            }}
          >
            <span className="absolute right-0 -top-5 text-xs text-destructive whitespace-nowrap">
              {(LEGAL_LIMITS.regular * 10).toFixed(1)}‰
            </span>
          </div>
        )}
        
        {LEGAL_LIMITS.professional <= roundedMaxBac && (
          <div 
            className="absolute w-full border-t-2 border-dashed border-amber-500 border-opacity-70"
            style={{ 
              top: `${100 - (LEGAL_LIMITS.professional / roundedMaxBac) * 100}%`,
              zIndex: 5
            }}
          >
            <span className="absolute right-0 -top-5 text-xs text-amber-500 whitespace-nowrap">
              {(LEGAL_LIMITS.professional * 10).toFixed(1)}‰
            </span>
          </div>
        )}
        
        {/* X-axis hour marks - better positioned */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex">
          {hourMarks.map((timePoint, index) => {
            // Calculate time difference in hours
            const hourDiff = (timePoint.getTime() - startTime.getTime()) / (60 * 60 * 1000);
            const percentX = (hourDiff / totalHours) * 100;
            
            // Skip if the label would be off-chart
            if (percentX < 0 || percentX > 100) return null;
            
            return (
              <div 
                key={`hour-${index}`} 
                className="absolute"
                style={{ left: `${percentX}%` }}
              >
                <div className="h-full w-px bg-border opacity-50 absolute top-[-220px]"></div>
                <div className="absolute -translate-x-1/2 text-xs text-muted-foreground font-medium whitespace-nowrap">
                  {formatTime(timePoint)}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Show sober time if available */}
        {soberTime && soberTime.getTime() > startTime.getTime() && (
          <div 
            className="absolute h-full"
            style={{ 
              left: `${(((soberTime.getTime() - startTime.getTime()) / (60 * 60 * 1000)) / totalHours) * 100}%` 
            }}
          >
            <div className="h-full w-px bg-green-500 opacity-70 dashed-border z-10"></div>
            <div className="absolute bottom-[-24px] transform -translate-x-1/2">
              <span className="text-xs text-green-500 font-medium whitespace-nowrap">
                Sober
              </span>
            </div>
          </div>
        )}

        {/* Draw the BAC line and area */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bacGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {straightLineData.length > 0 && (
            <>
              {/* Draw area under the line */}
              <path
                d={`
                  M ${getXCoordinate(straightLineData[0].time)} ${getYCoordinate(straightLineData[0].bac)}
                  ${straightLineData.map(point => `L ${getXCoordinate(point.time)} ${getYCoordinate(point.bac)}`).join(' ')}
                  L ${getXCoordinate(straightLineData[straightLineData.length - 1].time)} ${chartHeight}
                  L ${getXCoordinate(straightLineData[0].time)} ${chartHeight}
                  Z
                `}
                fill="url(#bacGradient)"
              />
              
              {/* Draw the line */}
              <path
                d={`
                  M ${getXCoordinate(straightLineData[0].time)} ${getYCoordinate(straightLineData[0].bac)}
                  ${straightLineData.map(point => `L ${getXCoordinate(point.time)} ${getYCoordinate(point.bac)}`).join(' ')}
                `}
                stroke="hsl(var(--primary))"
                strokeWidth="2.5"
                fill="none"
              />
              
              {/* Draw data points */}
              {straightLineData.map((point, index) => (
                <circle
                  key={index}
                  cx={getXCoordinate(point.time)}
                  cy={getYCoordinate(point.bac)}
                  r="3.5"
                  fill="hsl(var(--primary))"
                  stroke="var(--background)"
                  strokeWidth="1.5"
                />
              ))}
              
              {/* Highlight current time point */}
              <circle
                cx={getXCoordinate(straightLineData[0].time)}
                cy={getYCoordinate(straightLineData[0].bac)}
                r="5"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      </div>
      
      {/* Simple tooltips only for the current point */}
      {straightLineData.length > 0 && (
        <div
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ 
            left: `${getXPercent(straightLineData[0].time)}%`, 
            top: `${Math.min(50, getYPercent(straightLineData[0].bac))}%`
          }}
        >
          <div className="opacity-0 hover:opacity-100 transition-opacity z-20">
            <div className="bg-card text-card-foreground rounded-md shadow-lg px-3 py-2 text-xs border border-border">
              <div className="font-medium">Current</div>
              <div>{(straightLineData[0].bac * 10).toFixed(1)}‰</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Helper functions to calculate coordinates - improved to use hours for X-axis
  function getXCoordinate(time: Date): number {
    // Convert to hours since start
    const hoursSinceStart = (time.getTime() - startTime.getTime()) / (60 * 60 * 1000);
    
    // Calculate percentage based on total hours
    const percent = hoursSinceStart / totalHours;
    
    // Leave padding on left side for y-axis labels
    return 15 + percent * (100 - 15);
  }
  
  function getYCoordinate(bac: number): number {
    // SVG coordinates go from top to bottom, so we need to invert
    if (roundedMaxBac === 0) return chartHeight - 5; // Handle edge case
    
    const percent = bac / roundedMaxBac;
    // Leave 5% padding at the top, 5% at the bottom
    return chartHeight - (percent * (chartHeight - 10) + 5);
  }
  
  function getXPercent(time: Date): number {
    // Convert to hours since start
    const hoursSinceStart = (time.getTime() - startTime.getTime()) / (60 * 60 * 1000);
    
    // Calculate percentage based on total hours
    return (hoursSinceStart / totalHours) * 100;
  }
  
  function getYPercent(bac: number): number {
    if (roundedMaxBac === 0) return 100; // Handle edge case
    
    return 100 - ((bac / roundedMaxBac) * 100);
  }
};

export default BacChartGraph;
