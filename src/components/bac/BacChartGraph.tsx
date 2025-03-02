
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

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>
    );
  }

  // Calculate max BAC for scaling (with minimum of 0.1)
  const maxBac = Math.max(0.1, ...chartData.map(d => d.bac));
  
  // Get start and end times for the chart
  const startTime = chartData[0].time;
  const endTime = chartData[chartData.length - 1].time;
  
  // Calculate total hours for the chart
  const totalHours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
  
  // Create hour interval - aim for 4-8 marks
  let hourInterval = 1; // Default to 1 hour
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 6) {
    hourInterval = 2;
  }
  
  // Generate hour marks
  const hourMarks: Date[] = [];
  
  // Start from the first full hour
  const firstHour = new Date(startTime);
  firstHour.setMinutes(0, 0, 0);
  if (firstHour.getTime() < startTime.getTime()) {
    firstHour.setHours(firstHour.getHours() + 1);
  }
  
  // Add hour marks at regular intervals
  let currentHour = new Date(firstHour);
  while (currentHour.getTime() <= endTime.getTime()) {
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
  
  // Generate BAC marks from 0 up to maxBac (plus a little extra for display)
  for (let level = 0; level <= maxBac * 1.1; level += bacInterval) {
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

  // Calculate a fixed height for chart content - this is crucial for proper scaling
  const chartHeight = 350; // pixels

  return (
    <div className="w-full h-[400px] relative mb-4">
      {/* Chart container with fixed height for better scaling */}
      <div className="absolute inset-0 border-b border-l border-border pt-4 pb-8 pr-4" style={{ height: chartHeight }}>
        {/* Horizontal grid lines and Y-axis labels */}
        {bacMarks.map((level, index) => {
          // Skip if level is above our display range
          if (level > maxBac * 1.1) return null;
          
          // Calculate vertical position as percentage
          const percentY = 100 - (level / maxBac) * 100;
          // Skip if the label would be off-chart
          if (percentY < 0 || percentY > 100) return null;
          
          return (
            <div 
              key={`y-${index}`} 
              className="absolute w-full border-t border-border border-opacity-50 flex items-center"
              style={{ top: `${percentY}%` }}
            >
              <span className="absolute -left-10 -mt-2 text-xs text-muted-foreground whitespace-nowrap">
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
            <span className="absolute right-0 -top-5 text-xs text-destructive">
              Regular Limit ({(LEGAL_LIMITS.regular * 10).toFixed(1)}‰)
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
            <span className="absolute right-0 -top-5 text-xs text-amber-500">
              Professional Limit ({(LEGAL_LIMITS.professional * 10).toFixed(1)}‰)
            </span>
          </div>
        )}
        
        {/* X-axis hour marks */}
        {hourMarks.map((timePoint, index) => {
          const percentX = ((timePoint.getTime() - startTime.getTime()) / 
                         (endTime.getTime() - startTime.getTime())) * 100;
          
          // Skip if the label would be off-chart
          if (percentX < 0 || percentX > 100) return null;
          
          return (
            <div 
              key={`hour-${index}`} 
              className="absolute h-full"
              style={{ left: `${percentX}%` }}
            >
              <div className="absolute bottom-0 transform -translate-x-1/2 -translate-y-[-24px]">
                <span className="text-xs text-muted-foreground font-medium">
                  {formatTime(timePoint)}
                </span>
              </div>
              <div className="h-full w-px bg-border opacity-50"></div>
            </div>
          );
        })}
        
        {/* Show sober time if available */}
        {soberTime && (
          <div 
            className="absolute h-full"
            style={{ 
              left: `${((soberTime.getTime() - startTime.getTime()) / 
                      (endTime.getTime() - startTime.getTime())) * 100}%` 
            }}
          >
            <div className="h-full w-px bg-green-500 opacity-70 dashed-border z-10"></div>
            <div className="absolute bottom-0 transform -translate-x-1/2 -translate-y-[-24px]">
              <span className="text-xs text-green-500 font-medium">
                Sober ({formatTime(soberTime)})
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
          
          {/* Draw area under the line */}
          <path
            d={`
              M ${getXCoordinate(chartData[0].time)} ${getYCoordinate(chartData[0].bac)}
              ${chartData.map(point => `L ${getXCoordinate(point.time)} ${getYCoordinate(point.bac)}`).join(' ')}
              L ${getXCoordinate(chartData[chartData.length - 1].time)} ${getYCoordinate(0)}
              L ${getXCoordinate(chartData[0].time)} ${getYCoordinate(0)}
              Z
            `}
            fill="url(#bacGradient)"
          />
          
          {/* Draw the line */}
          <path
            d={`
              M ${getXCoordinate(chartData[0].time)} ${getYCoordinate(chartData[0].bac)}
              ${chartData.map(point => `L ${getXCoordinate(point.time)} ${getYCoordinate(point.bac)}`).join(' ')}
            `}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Draw data points */}
          {chartData.map((point, index) => (
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
        </svg>
      </div>
      
      {/* Tooltips for each data point */}
      {chartData.map((point, index) => (
        <div
          key={`tooltip-${index}`}
          className="absolute -translate-x-1/2 -translate-y-full group"
          style={{ 
            left: `${getXPercent(point.time)}%`, 
            top: `${getYPercent(point.bac)}%` 
          }}
        >
          <div className="w-2 h-2 opacity-0 group-hover:opacity-100"></div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100">
            <div className="bg-card text-card-foreground rounded-md shadow-lg px-3 py-2 text-xs border border-border">
              <div className="font-medium">{formatTime(point.time)}</div>
              <div>{(point.bac * 10).toFixed(1)}‰</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Helper functions to calculate coordinates
  function getXCoordinate(time: Date): number {
    const chartStartTime = chartData[0].time.getTime();
    const chartEndTime = chartData[chartData.length - 1].time.getTime();
    const timeRange = chartEndTime - chartStartTime;
    
    if (timeRange === 0) return 5; // Handle edge case
    
    const percent = (time.getTime() - chartStartTime) / timeRange;
    // Leave 5% padding on left side and 2% on right
    return 5 + percent * 93;
  }
  
  function getYCoordinate(bac: number): number {
    // SVG coordinates go from top to bottom, so we need to invert
    if (maxBac === 0) return 95; // Handle edge case
    
    const percent = bac / maxBac;
    // Leave 5% padding at the top, 5% at the bottom
    return 95 - (percent * 90);
  }
  
  function getXPercent(time: Date): number {
    const chartStartTime = chartData[0].time.getTime();
    const chartEndTime = chartData[chartData.length - 1].time.getTime();
    const timeRange = chartEndTime - chartStartTime;
    
    if (timeRange === 0) return 0; // Handle edge case
    
    return ((time.getTime() - chartStartTime) / timeRange) * 100;
  }
  
  function getYPercent(bac: number): number {
    if (maxBac === 0) return 100; // Handle edge case
    
    return 100 - ((bac / maxBac) * 100);
  }
};

export default BacChartGraph;

