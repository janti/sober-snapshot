
import React from 'react';
import { BacDataPoint, ChartCoordinates } from './types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BacLineGraphProps {
  chartData: BacDataPoint[];
  chartHeight: number;
  coordinates: ChartCoordinates;
}

export const BacLineGraph: React.FC<BacLineGraphProps> = ({ 
  chartData, 
  chartHeight, 
  coordinates 
}) => {
  // Ensure we have at least the first (current) and last (sober) points
  // Even if BAC is 0, we need to display these critical points
  if (chartData.length === 0) return null;
  
  // Always include first point (current time) and last point (sober time)
  const currentTimePoint = chartData[0];
  const soberTimePoint = chartData[chartData.length - 1];
  
  // For intermediate points, filter out zero BAC points
  const intermediatePoints = chartData.slice(1, -1).filter(point => point.bac > 0);
  
  // Construct display data with at least current and sober time points
  const displayData = [currentTimePoint, ...intermediatePoints];
  
  // Only add sober time point if it's different from current time
  if (chartData.length > 1 && soberTimePoint.time.getTime() !== currentTimePoint.time.getTime()) {
    displayData.push(soberTimePoint);
  }

  // Format time for tooltip display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Create path coordinates - always connecting current to sober time
  const createPath = () => {
    if (displayData.length < 2) {
      // If only one point, create horizontal line to show time passage
      const x1 = coordinates.getXCoordinate(displayData[0].time);
      const y1 = coordinates.getYCoordinate(displayData[0].bac);
      const x2 = x1 + 20; // Show a small line to indicate time direction
      return `M ${x1}% ${y1} L ${x2}% ${y1}`;
    }
    
    // Start with the first point (current time)
    let path = `M ${coordinates.getXCoordinate(displayData[0].time)}% ${coordinates.getYCoordinate(displayData[0].bac)}`;
    
    // Add line segments to each subsequent point
    for (let i = 1; i < displayData.length; i++) {
      path += ` L ${coordinates.getXCoordinate(displayData[i].time)}% ${coordinates.getYCoordinate(displayData[i].bac)}`;
    }
    
    return path;
  };

  // Create area under the path
  const createAreaPath = () => {
    if (displayData.length < 2) {
      // If only one point, create small area to show time direction
      const x1 = coordinates.getXCoordinate(displayData[0].time);
      const y1 = coordinates.getYCoordinate(displayData[0].bac);
      const x2 = x1 + 20; // Show a small area to indicate time direction
      
      return `M ${x1}% ${y1} L ${x2}% ${y1} L ${x2}% ${chartHeight} L ${x1}% ${chartHeight} Z`;
    }
    
    // Start with the first point (current time)
    let path = `M ${coordinates.getXCoordinate(displayData[0].time)}% ${coordinates.getYCoordinate(displayData[0].bac)}`;
    
    // Add line segments to each subsequent point
    for (let i = 1; i < displayData.length; i++) {
      path += ` L ${coordinates.getXCoordinate(displayData[i].time)}% ${coordinates.getYCoordinate(displayData[i].bac)}`;
    }
    
    // Complete the area by drawing lines to the bottom and back to the start
    const lastPointX = coordinates.getXCoordinate(displayData[displayData.length - 1].time);
    const firstPointX = coordinates.getXCoordinate(displayData[0].time);
    
    path += ` L ${lastPointX}% ${chartHeight}`;  // Line down from last point
    path += ` L ${firstPointX}% ${chartHeight}`;  // Line across the bottom
    path += ' Z';  // Close the path
    
    return path;
  };

  // Check if we have a sober point
  const isSoberPoint = displayData.length > 1 && 
    (displayData[displayData.length - 1].bac === 0 || 
     displayData[displayData.length - 1].bac < 0.001);

  return (
    <TooltipProvider>
      <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bacGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Fill area under the line */}
        <path
          d={createAreaPath()}
          fill="url(#bacGradient)"
          className="transition-all duration-300"
        />
        
        {/* Draw the line itself - highlighted to show timeline from current to sober */}
        <path
          d={createPath()}
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          className="transition-all duration-300"
        />
        
        {/* Add dots for all points along the BAC line */}
        {displayData.map((point, index) => (
          <foreignObject
            key={index}
            x={`${coordinates.getXCoordinate(point.time)}%`}
            y={coordinates.getYCoordinate(point.bac) - 10}
            width={20}
            height={20}
            style={{ transform: 'translateX(-10px)' }}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-[20px] h-[20px] flex items-center justify-center group cursor-pointer">
                  <div 
                    className={`rounded-full transition-all duration-300
                    ${index === 0 ? 'bg-primary w-[10px] h-[10px]' : 
                     index === displayData.length - 1 && isSoberPoint ? 'bg-green-500 w-[10px] h-[10px]' : 
                     'bg-primary/70 w-[6px] h-[6px] group-hover:w-[10px] group-hover:h-[10px]'}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card border-border p-2 shadow-md z-50">
                <div className="text-xs font-medium">
                  <div className="font-bold">
                    {index === 0 ? 'Current time' : 
                     index === displayData.length - 1 && isSoberPoint ? 'Sober time' : 'Time'}: {formatTime(point.time)}
                  </div>
                  <div>BAC: {(point.bac * 10).toFixed(2)}‰</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </foreignObject>
        ))}
        
        {/* Current BAC point indicator (highlighted) */}
        <circle
          cx={`${coordinates.getXCoordinate(currentTimePoint.time)}%`}
          cy={coordinates.getYCoordinate(currentTimePoint.bac)}
          r="5"
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth="2"
        />
        
        {/* Sober time indicator (if available and different from current) */}
        {displayData.length > 1 && isSoberPoint && (
          <circle
            cx={`${coordinates.getXCoordinate(displayData[displayData.length - 1].time)}%`}
            cy={coordinates.getYCoordinate(displayData[displayData.length - 1].bac)}
            r="5"
            fill="hsl(var(--success))"
            stroke="white"
            strokeWidth="2"
          />
        )}
      </svg>
    </TooltipProvider>
  );
};
