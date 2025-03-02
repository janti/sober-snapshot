
import React from 'react';
import { BacDataPoint, ChartCoordinates } from './types';

interface BacAxisLabelsProps {
  hourMarks: Date[];
  bacMarks: number[];
  formatTime: (date: Date) => string;
  chartHeight: number;
  leftPadding: number;
  totalHours: number;
  startTime: Date;
  coordinates: ChartCoordinates;
}

export const BacAxisLabels: React.FC<BacAxisLabelsProps> = ({
  hourMarks,
  bacMarks,
  formatTime,
  chartHeight,
  leftPadding,
  coordinates
}) => {
  return (
    <>
      {/* Y-axis labels and horizontal grid lines */}
      {bacMarks.map((level, index) => {
        const yPosition = coordinates.getYCoordinate(level);
        
        return (
          <div 
            key={`y-${index}`} 
            className="absolute w-full border-t border-border border-opacity-50 flex items-center"
            style={{ top: `${yPosition}px`, left: 0 }}
          >
            <span className="absolute -left-[46px] -mt-2 text-xs text-muted-foreground whitespace-nowrap">
              {(level * 10).toFixed(1)}‰
            </span>
          </div>
        );
      })}
      
      {/* X-axis time labels and vertical grid lines */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {hourMarks.map((timePoint, index) => {
          const xPosition = coordinates.getXCoordinate(timePoint);
          
          // Only render if we have a valid time and it's within our chart bounds
          if (isNaN(xPosition) || xPosition < 0 || xPosition > 100) return null;
          
          // Determine if this is an even hour for styling
          const isEvenHour = timePoint.getHours() % 2 === 0 && timePoint.getMinutes() === 0;
          const isFullHour = timePoint.getMinutes() === 0;
          
          // Make the current time (first marker) more prominent
          const isCurrentTime = index === 0;
          
          // Only show labels for even hours and current time to avoid crowding
          const showLabel = isEvenHour || isCurrentTime || !isFullHour;
          
          return (
            <div 
              key={`hour-${index}`} 
              className="absolute"
              style={{ left: `${xPosition}%` }}
            >
              <div className={`h-full w-px ${
                isEvenHour ? 'bg-border' : 
                isFullHour ? 'bg-border opacity-30' : 
                'bg-border opacity-20'
              } absolute top-[-${chartHeight}px] ${isCurrentTime ? 'bg-primary bg-opacity-50 w-[2px]' : ''}`}></div>
              
              {showLabel && (
                <div className={`absolute -translate-x-1/2 text-xs whitespace-nowrap ${isCurrentTime ? 'font-medium text-primary' : isEvenHour ? 'text-muted-foreground' : 'text-muted-foreground opacity-70'}`}>
                  {formatTime(timePoint)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};
