
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
  if (chartData.length === 0) return null;

  // Format time for tooltip display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Create path coordinates
  const createPath = () => {
    if (chartData.length < 2) return '';
    
    const x1 = coordinates.getXCoordinate(chartData[0].time);
    const y1 = coordinates.getYCoordinate(chartData[0].bac);
    const x2 = coordinates.getXCoordinate(chartData[1].time);
    const y2 = coordinates.getYCoordinate(chartData[1].bac);
    
    return `M ${x1}% ${y1} L ${x2}% ${y2}`;
  };

  // Create area under the path
  const createAreaPath = () => {
    if (chartData.length < 2) return '';
    
    const x1 = coordinates.getXCoordinate(chartData[0].time);
    const y1 = coordinates.getYCoordinate(chartData[0].bac);
    const x2 = coordinates.getXCoordinate(chartData[1].time);
    const y2 = coordinates.getYCoordinate(chartData[1].bac);
    
    return `
      M ${x1}% ${y1}
      L ${x2}% ${y2}
      L ${x2}% ${chartHeight}
      L ${x1}% ${chartHeight}
      Z
    `;
  };

  return (
    <TooltipProvider>
      <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bacGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {chartData.length >= 2 ? (
          <>
            {/* Fill area under the line */}
            <path
              d={createAreaPath()}
              fill="url(#bacGradient)"
            />
            
            {/* Draw the line itself */}
            <path
              d={createPath()}
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              fill="none"
            />
          </>
        ) : (
          // Fallback for single data point
          <path
            d={`
              M ${coordinates.getXCoordinate(chartData[0].time)}% ${coordinates.getYCoordinate(chartData[0].bac)}
              L ${coordinates.getXCoordinate(new Date(chartData[0].time.getTime() + 3 * 60 * 60 * 1000))}% ${coordinates.getYCoordinate(chartData[0].bac)}
            `}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
        )}
        
        {/* Add tooltips for data points */}
        {chartData.map((point, index) => (
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
                <div className="w-[20px] h-[20px] flex items-center justify-center">
                  <div 
                    className={`w-[10px] h-[10px] rounded-full ${index === 0 ? 'bg-primary' : 'bg-primary/50'}`}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-card border-border p-2 shadow-md">
                <div className="text-xs font-medium">
                  <div>Time: {formatTime(point.time)}</div>
                  <div>BAC: {(point.bac * 10).toFixed(1)}‰</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </foreignObject>
        ))}
        
        {/* Current BAC point indicator */}
        <circle
          cx={`${coordinates.getXCoordinate(chartData[0].time)}%`}
          cy={coordinates.getYCoordinate(chartData[0].bac)}
          r="5"
          fill="hsl(var(--primary))"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
    </TooltipProvider>
  );
};
