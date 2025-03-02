
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
    
    // Sort data by time
    const sortedData = [...data].sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Get the current time
    const now = new Date();
    
    // Find the last known BAC value (most recent data point)
    const currentPoint = sortedData.find(point => 
      Math.abs(point.time.getTime() - now.getTime()) < 5 * 60 * 1000
    ) || sortedData[sortedData.length - 1];
    
    // Create the data points for the chart (current point + future points if any)
    const finalData = [
      { time: now, bac: currentPoint.bac },
      ...sortedData.filter(point => point.time.getTime() > now.getTime())
    ];
    
    setChartData(finalData);
  }, [data]);

  // Format time for display - using hours only
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>
    );
  }

  // Calculate max BAC for scaling (with minimum of 0.08 to ensure proper visualization)
  const maxBac = Math.max(0.08, ...chartData.map(d => d.bac * 1.2));
  
  // Get start and end times for the chart
  const startTime = new Date(); // Always use current time as start
  const endTime = soberTime || 
    new Date(Math.max(
      ...chartData.map(d => d.time.getTime()),
      startTime.getTime() + 3 * 60 * 60 * 1000 // At least 3 hours
    ));
  
  // Calculate total hours for the chart (minimum 3)
  const totalHours = Math.max(3, (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000));
  
  // Determine hour interval based on total duration
  let hourInterval = 1; // Default to 1 hour
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 6) {
    hourInterval = 2;
  }
  
  // Generate hour marks from current time
  const hourMarks: Date[] = [];
  let currentHour = new Date(startTime);
  
  // Round to the nearest hour
  currentHour.setMinutes(0, 0, 0);
  if (currentHour.getTime() < startTime.getTime()) {
    currentHour.setHours(currentHour.getHours() + 1);
  }
  
  // Add hour marks until end time
  while (currentHour.getTime() <= endTime.getTime()) {
    hourMarks.push(new Date(currentHour));
    currentHour.setHours(currentHour.getHours() + hourInterval);
  }

  // Create BAC level marks with appropriate intervals, including zero
  const bacMarks: number[] = [0]; // Start from zero
  let bacInterval = 0.02;
  
  if (maxBac > 0.4) {
    bacInterval = 0.1;
  } else if (maxBac > 0.2) {
    bacInterval = 0.05;
  }
  
  for (let level = bacInterval; level <= maxBac; level += bacInterval) {
    bacMarks.push(parseFloat(level.toFixed(4))); // Avoid floating point issues
  }

  // Chart dimensions - reduce height to prevent overflow
  const chartHeight = 180;
  const leftPadding = 40;

  return (
    <div className="w-full h-[230px] relative mb-2">
      {/* Chart container */}
      <div className="absolute inset-0 border-b border-l border-border pt-2 pb-6 pl-2" style={{ height: chartHeight }}>
        {/* Horizontal grid lines and Y-axis labels */}
        {bacMarks.map((level, index) => {
          const percentY = 100 - (level / maxBac) * 100;
          
          return (
            <div 
              key={`y-${index}`} 
              className="absolute w-full border-t border-border border-opacity-50 flex items-center"
              style={{ top: `${percentY}%`, left: 0 }}
            >
              <span className="absolute -left-[36px] -mt-2 text-xs text-muted-foreground whitespace-nowrap">
                {(level * 10).toFixed(1)}‰
              </span>
            </div>
          );
        })}
        
        {/* Draw legal limit lines */}
        {LEGAL_LIMITS.regular <= maxBac && (
          <div 
            className="absolute w-full border-t-2 border-dashed border-destructive border-opacity-70"
            style={{ 
              top: `${100 - (LEGAL_LIMITS.regular / maxBac) * 100}%`,
              zIndex: 5
            }}
          >
            <span className="absolute right-0 -top-5 text-xs text-destructive whitespace-nowrap">
              {(LEGAL_LIMITS.regular * 10).toFixed(1)}‰
            </span>
          </div>
        )}
        
        {LEGAL_LIMITS.professional <= maxBac && (
          <div 
            className="absolute w-full border-t-2 border-dashed border-amber-500 border-opacity-70"
            style={{ 
              top: `${100 - (LEGAL_LIMITS.professional / maxBac) * 100}%`,
              zIndex: 5
            }}
          >
            <span className="absolute right-0 -top-5 text-xs text-amber-500 whitespace-nowrap">
              {(LEGAL_LIMITS.professional * 10).toFixed(1)}‰
            </span>
          </div>
        )}
        
        {/* X-axis hour marks */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex">
          {hourMarks.map((timePoint, index) => {
            // Calculate horizontal position
            const hourDiff = (timePoint.getTime() - startTime.getTime()) / (60 * 60 * 1000);
            const percentX = (hourDiff / totalHours) * 100;
            
            return (
              <div 
                key={`hour-${index}`} 
                className="absolute"
                style={{ left: `${leftPadding + (percentX * (100 - leftPadding) / 100)}px` }}
              >
                <div className="h-full w-px bg-border opacity-50 absolute top-[-180px]"></div>
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
              left: `${leftPadding + ((soberTime.getTime() - startTime.getTime()) / (totalHours * 60 * 60 * 1000)) * (100 - leftPadding)}px` 
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

        {/* Draw the BAC line - make it a simple straight line */}
        <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bacGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {chartData.length > 0 && (
            <>
              {/* Only draw from current time to sober time or just a simple line */}
              {chartData.length >= 2 ? (
                <>
                  {/* Draw area under the line */}
                  <path
                    d={`
                      M ${getXCoordinate(chartData[0].time)} ${getYCoordinate(chartData[0].bac)}
                      L ${getXCoordinate(chartData[chartData.length - 1].time)} ${getYCoordinate(0)}
                      L ${getXCoordinate(chartData[chartData.length - 1].time)} ${chartHeight}
                      L ${getXCoordinate(chartData[0].time)} ${chartHeight}
                      Z
                    `}
                    fill="url(#bacGradient)"
                  />
                  
                  {/* Draw the line */}
                  <path
                    d={`
                      M ${getXCoordinate(chartData[0].time)} ${getYCoordinate(chartData[0].bac)}
                      L ${getXCoordinate(chartData[chartData.length - 1].time)} ${getYCoordinate(0)}
                    `}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    fill="none"
                  />
                </>
              ) : (
                <>
                  {/* If we only have one point, draw a flat line */}
                  <path
                    d={`
                      M ${getXCoordinate(chartData[0].time)} ${getYCoordinate(chartData[0].bac)}
                      L ${getXCoordinate(new Date(chartData[0].time.getTime() + 3 * 60 * 60 * 1000))} ${getYCoordinate(chartData[0].bac)}
                    `}
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    fill="none"
                  />
                </>
              )}
              
              {/* Add circle for current point */}
              <circle
                cx={getXCoordinate(chartData[0].time)}
                cy={getYCoordinate(chartData[0].bac)}
                r="5"
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}
        </svg>
      </div>
      
      {/* Tooltip for the current BAC */}
      {chartData.length > 0 && (
        <div
          className="absolute bg-card text-card-foreground rounded-md shadow-lg px-3 py-2 text-xs border border-border -translate-y-full z-20"
          style={{ 
            left: `${leftPadding + 10}px`, 
            top: `${getYCoordinate(chartData[0].bac) - 10}px`
          }}
        >
          <div className="font-medium">Current</div>
          <div>{(chartData[0].bac * 10).toFixed(1)}‰</div>
        </div>
      )}
    </div>
  );
  
  // Helper functions to calculate coordinates
  function getXCoordinate(time: Date): number {
    // Convert to hours since start
    const hoursSinceStart = (time.getTime() - startTime.getTime()) / (60 * 60 * 1000);
    
    // Calculate percentage based on total hours
    const percent = hoursSinceStart / totalHours;
    
    // Adjust for left padding
    return leftPadding + percent * (100 - leftPadding);
  }
  
  function getYCoordinate(bac: number): number {
    // SVG coordinates go from top to bottom, so we need to invert
    if (maxBac === 0) return chartHeight - 5; // Handle edge case
    
    const percent = bac / maxBac;
    // Leave 5% padding at the top
    return chartHeight - (percent * chartHeight);
  }
};

export default BacChartGraph;
