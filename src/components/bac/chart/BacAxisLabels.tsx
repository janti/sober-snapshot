
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
      {/* Horizontal grid lines and Y-axis labels */}
      {bacMarks.map((level, index) => {
        const percentY = 100 - (level / (Math.max(...bacMarks) || 0.01)) * 100;
        
        return (
          <div 
            key={`y-${index}`} 
            className="absolute w-full border-t border-border border-opacity-50 flex items-center"
            style={{ top: `${percentY}%`, left: 0 }}
          >
            <span className="absolute -left-[46px] -mt-2 text-xs text-muted-foreground whitespace-nowrap">
              {(level * 10).toFixed(1)}‰
            </span>
          </div>
        );
      })}
      
      {/* X-axis hour marks */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {hourMarks.map((timePoint, index) => {
          const xPos = coordinates.getXCoordinate(timePoint);
          
          return (
            <div 
              key={`hour-${index}`} 
              className="absolute"
              style={{ left: `${xPos}%` }}
            >
              <div className={`h-full w-px bg-border opacity-50 absolute top-[-${chartHeight}px] ${index === 0 ? 'bg-primary bg-opacity-30' : ''}`}></div>
              <div className="absolute -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {formatTime(timePoint)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
