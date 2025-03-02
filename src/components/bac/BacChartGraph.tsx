
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

  // Calculate max BAC for scaling (with minimum of 0.1)
  const maxBac = Math.max(...(data.map(d => d.bac) || [0]), 0.1);
  
  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>
    );
  }

  // Get start and end times for the chart
  const startTime = chartData[0].time;
  const endTime = chartData[chartData.length - 1].time;
  
  // Calculate a nice hour interval
  const totalHours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
  
  // Create hour marks - aim for 5-7 marks
  let hourInterval = 1; // Default to 1 hour
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 7) {
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

  return (
    <div className="w-full h-full relative">
      {/* Draw the grid */}
      <div className="absolute inset-0 border-b border-l border-border">
        {/* Horizontal grid lines and Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((level) => {
          const percentY = 100 - (level / maxBac) * 100;
          return (
            <div 
              key={`y-${level}`} 
              className="absolute w-full border-t border-border border-opacity-50"
              style={{ top: `${percentY}%` }}
            >
              <span className="absolute -left-8 -top-3 text-xs text-muted-foreground">
                {(level * 10).toFixed(1)}‰
              </span>
            </div>
          );
        })}
        
        {/* Draw legal limit lines */}
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
        
        {/* X-axis hour marks */}
        {hourMarks.map((timePoint, index) => {
          const percentX = ((timePoint.getTime() - startTime.getTime()) / 
                          (endTime.getTime() - startTime.getTime())) * 100;
          
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
      </div>

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
          strokeWidth="2"
          fill="none"
        />
        
        {/* Draw data points */}
        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={getXCoordinate(point.time)}
            cy={getYCoordinate(point.bac)}
            r="3"
            fill="hsl(var(--primary))"
            stroke="var(--background)"
            strokeWidth="1"
          />
        ))}
      </svg>
      
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
    const startTime = chartData[0].time.getTime();
    const endTime = chartData[chartData.length - 1].time.getTime();
    const percent = (time.getTime() - startTime) / (endTime - startTime);
    // Leave 5% padding on each side
    return 5 + percent * 90;
  }
  
  function getYCoordinate(bac: number): number {
    // SVG coordinates go from top to bottom, so we need to invert
    const percent = bac / maxBac;
    // Leave 5% padding at the top
    return 100 - (5 + percent * 90);
  }
  
  function getXPercent(time: Date): number {
    const startTime = chartData[0].time.getTime();
    const endTime = chartData[chartData.length - 1].time.getTime();
    return ((time.getTime() - startTime) / (endTime - startTime)) * 100;
  }
  
  function getYPercent(bac: number): number {
    return 100 - ((bac / maxBac) * 100);
  }
};

export default BacChartGraph;
