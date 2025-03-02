
import React from 'react';
import { BacDataPoint, ChartCoordinates } from './types';

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

  return (
    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
      <defs>
        <linearGradient id="bacGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {chartData.length >= 2 ? (
        <>
          {/* Draw area under the line */}
          <path
            d={`
              M ${coordinates.getXCoordinate(chartData[0].time)} ${coordinates.getYCoordinate(chartData[0].bac)}
              L ${coordinates.getXCoordinate(chartData[1].time)} ${coordinates.getYCoordinate(chartData[1].bac)}
              L ${coordinates.getXCoordinate(chartData[1].time)} ${chartHeight}
              L ${coordinates.getXCoordinate(chartData[0].time)} ${chartHeight}
              Z
            `}
            fill="url(#bacGradient)"
          />
          
          {/* Draw the line */}
          <path
            d={`
              M ${coordinates.getXCoordinate(chartData[0].time)} ${coordinates.getYCoordinate(chartData[0].bac)}
              L ${coordinates.getXCoordinate(chartData[1].time)} ${coordinates.getYCoordinate(chartData[1].bac)}
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
              M ${coordinates.getXCoordinate(chartData[0].time)} ${coordinates.getYCoordinate(chartData[0].bac)}
              L ${coordinates.getXCoordinate(new Date(chartData[0].time.getTime() + 3 * 60 * 60 * 1000))} ${coordinates.getYCoordinate(chartData[0].bac)}
            `}
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            fill="none"
          />
        </>
      )}
      
      {/* Add circle for current point */}
      <circle
        cx={coordinates.getXCoordinate(chartData[0].time)}
        cy={coordinates.getYCoordinate(chartData[0].bac)}
        r="5"
        fill="hsl(var(--primary))"
        stroke="white"
        strokeWidth="2"
      />
    </svg>
  );
};
