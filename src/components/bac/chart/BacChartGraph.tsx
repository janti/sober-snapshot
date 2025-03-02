
import React, { useEffect, useState } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { BacAxisLabels } from './BacAxisLabels';
import { BacLegalLimitLines } from './BacLegalLimitLines';
import { BacLineGraph } from './BacLineGraph';
import { BacDataPoint } from './types';

interface BacChartGraphProps {
  data: BacDataPoint[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<BacDataPoint[]>([]);
  
  // Process data when it changes
  useEffect(() => {
    console.log("Chart data updated with", data.length, "points");
    
    if (data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Sort data by time
    const sortedData = [...data].sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Use the most recent data point that is not in the future as the starting point
    const now = new Date();
    const currentDataPoints = sortedData.filter(point => point.time <= now);
    
    // Find the current BAC value
    let currentBac = 0;
    if (currentDataPoints.length > 0) {
      // Get the most recent point's BAC
      currentBac = currentDataPoints[currentDataPoints.length - 1].bac;
    }
    
    // For a straight line, we need the current point and sober time (BAC = 0)
    if (soberTime && soberTime > now) {
      setChartData([
        { time: now, bac: currentBac },
        { time: soberTime, bac: 0 }
      ]);
    } else {
      // If no sober time or already sober, use a flat line for 3 hours
      const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      setChartData([
        { time: now, bac: currentBac },
        { time: threeHoursLater, bac: currentBac }
      ]);
    }
  }, [data, soberTime]);

  // Format time for display
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
  
  // Always use current time as start for x-axis
  const now = new Date(); 
  const startTime = now;
  const endTime = soberTime && soberTime > now ? 
    soberTime : 
    new Date(now.getTime() + 3 * 60 * 60 * 1000);
  
  // Calculate total hours for the chart (minimum 3)
  const totalHours = Math.max(3, (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000));
  
  // Determine hour interval based on total duration
  let hourInterval = 1; // Default to 1 hour
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 6) {
    hourInterval = 2;
  }

  // Generate hour marks starting from current time at regular intervals
  const hourMarks: Date[] = [];
  
  // Always add the current time as first mark
  hourMarks.push(new Date(now));
  
  // Add hour marks at fixed intervals
  let currentHour = new Date(now);
  currentHour.setMinutes(0, 0, 0); // Round to the current hour
  
  // If we're past the half-hour mark, move to the next hour
  if (now.getMinutes() >= 30) {
    currentHour.setHours(currentHour.getHours() + 1);
  }
  
  // Add hour marks at regular intervals
  while (hourMarks.length < 5 && currentHour <= endTime) {
    if (currentHour > now) { // Only add future hours
      hourMarks.push(new Date(currentHour));
    }
    currentHour.setHours(currentHour.getHours() + hourInterval);
  }
  
  // Create BAC level marks with appropriate intervals, always including zero
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

  // Chart dimensions
  const chartHeight = 180;
  const leftPadding = 50; // For Y-axis labels
  
  // Helper functions to calculate coordinates
  const coordinates = {
    getXCoordinate(time: Date): number {
      // Convert to hours since start
      const hoursSinceStart = (time.getTime() - startTime.getTime()) / (60 * 60 * 1000);
      
      // Calculate percentage based on total hours
      const percent = hoursSinceStart / totalHours;
      
      // Convert percentage to actual position - using actual percentage of available width
      return leftPadding + percent * (100 - leftPadding);
    },
    
    getYCoordinate(bac: number): number {
      // SVG coordinates go from top to bottom, so we need to invert
      if (maxBac === 0) return chartHeight - 5; // Handle edge case
      
      const percent = bac / maxBac;
      // Leave 5% padding at the top
      return chartHeight - (percent * chartHeight);
    }
  };

  return (
    <div className="w-full h-[230px] relative mb-2">
      {/* Chart container */}
      <div className="absolute inset-0 border-b border-l border-border pt-2 pb-6 pl-2" style={{ height: chartHeight }}>
        
        <BacAxisLabels 
          hourMarks={hourMarks}
          bacMarks={bacMarks}
          formatTime={formatTime}
          chartHeight={chartHeight}
          leftPadding={leftPadding}
          totalHours={totalHours}
          startTime={startTime}
          coordinates={coordinates}
        />
        
        <BacLegalLimitLines maxBac={maxBac} />
        
        {/* Show sober time if available */}
        {soberTime && soberTime > startTime && (
          <div 
            className="absolute h-full"
            style={{ 
              left: `${leftPadding + ((soberTime.getTime() - startTime.getTime()) / (totalHours * 60 * 60 * 1000)) * (100 - leftPadding)}%` 
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

        <BacLineGraph 
          chartData={chartData} 
          chartHeight={chartHeight} 
          coordinates={coordinates} 
        />
      </div>
      
      {/* Tooltip for the current BAC */}
      {chartData.length > 0 && (
        <div
          className="absolute bg-card text-card-foreground rounded-md shadow-lg px-3 py-2 text-xs border border-border -translate-y-full z-20"
          style={{ 
            left: `${leftPadding + 10}px`, 
            top: `${coordinates.getYCoordinate(chartData[0].bac) - 10}px`
          }}
        >
          <div className="font-medium">Current</div>
          <div>{(chartData[0].bac * 10).toFixed(1)}‰</div>
        </div>
      )}
    </div>
  );
};

export default BacChartGraph;
