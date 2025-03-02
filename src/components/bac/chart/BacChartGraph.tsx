
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

const BacChartGraph: React.FC<BacChartGraphProps> = ({
  data,
  soberTime
}) => {
  const [chartData, setChartData] = useState<BacDataPoint[]>([]);

  // Process data when it changes
  useEffect(() => {
    console.log("Chart data updated with", data.length, "points");
    
    // If we have no data, reset chart data
    if (data.length === 0) {
      setChartData([]);
      return;
    }

    // Create a copy of the data so we don't modify the original
    const newChartData = [...data]
      .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    // Ensure we have at least one point
    if (newChartData.length === 0 && data.length > 0) {
      newChartData.push(data[0]);
    }
    
    // If there's only one data point, add a projection point
    if (newChartData.length === 1) {
      // If we have sober time, use that for the second point
      if (soberTime) {
        newChartData.push({
          time: soberTime,
          bac: 0
        });
      } else {
        // Otherwise, add a point 1 hour later with slightly lower BAC
        const nextTime = new Date(newChartData[0].time.getTime() + 60 * 60 * 1000);
        const nextBac = Math.max(0, newChartData[0].bac - 0.015); // Subtract standard elimination rate
        newChartData.push({
          time: nextTime,
          bac: nextBac
        });
      }
    }
    
    setChartData(newChartData);
    
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
    return <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>;
  }

  // Calculate max BAC for y-axis (with minimum of 0.08 to ensure proper visualization)
  const maxBac = Math.max(0.08, ...chartData.map(d => d.bac * 1.2));

  // Get current time
  const now = new Date();

  // Define time range for x-axis
  const startTime = chartData[0].time; // Use first data point time as start
  // Set end time to soberTime or 12 hours from now, whichever is earlier
  const endTime = soberTime && soberTime < new Date(now.getTime() + 12 * 60 * 60 * 1000)
    ? new Date(soberTime.getTime() + 60 * 60 * 1000) // Add 1 hour padding after sober time
    : new Date(now.getTime() + 12 * 60 * 60 * 1000);

  // Calculate total duration in hours
  const totalHours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);

  // Generate time markers for x-axis
  const hourMarks: Date[] = [];

  // Add current time as first marker
  hourMarks.push(new Date(startTime));

  // Generate hourly markers from startTime to endTime
  for (let i = 1; i <= Math.ceil(totalHours); i++) {
    const nextHour = new Date(startTime);
    nextHour.setHours(startTime.getHours() + i, 0, 0, 0);
    
    // Only add if it's not past our end time
    if (nextHour <= endTime) {
      hourMarks.push(nextHour);
    }
  }

  // If sober time doesn't fall on an hour mark and it's within our window, add it
  if (soberTime && soberTime > startTime && soberTime <= endTime) {
    const isSoberTimeIncluded = hourMarks.some(mark => 
      Math.abs(mark.getTime() - soberTime.getTime()) < 60 * 1000 // Within a minute
    );
    
    if (!isSoberTimeIncluded) {
      hourMarks.push(soberTime);
      // Sort marks by time to ensure proper order
      hourMarks.sort((a, b) => a.getTime() - b.getTime());
    }
  }

  // Generate y-axis BAC value markers
  const bacMarks: number[] = [0]; // Always include zero

  // Determine BAC interval based on max value
  let bacInterval = 0.02;
  if (maxBac > 0.4) {
    bacInterval = 0.1;
  } else if (maxBac > 0.2) {
    bacInterval = 0.05;
  }

  // Add BAC markers
  for (let bac = bacInterval; bac <= maxBac; bac += bacInterval) {
    bacMarks.push(parseFloat(bac.toFixed(4))); // Fix floating point precision
  }

  // Chart dimensions
  const chartHeight = 180;
  const leftPadding = 50; // Space for y-axis labels

  // Coordinate calculation functions
  const coordinates = {
    getXCoordinate(time: Date): number {
      // Calculate position as percentage of total time range
      const timePosition = time.getTime() - startTime.getTime();
      const totalTimeRange = endTime.getTime() - startTime.getTime();
      // Ensure the percentage is between 0 and 100
      const percentage = Math.max(0, Math.min(100, (timePosition / totalTimeRange * 100)));
      
      return percentage;
    },
    getYCoordinate(bac: number): number {
      // Invert y-coordinate (0 at bottom, maxBac at top)
      return chartHeight - bac / maxBac * chartHeight;
    }
  };

  return (
    <div className="w-full h-[230px] relative mb-2 mx-[10px]">
      {/* Chart container */}
      <div 
        className="absolute inset-0 border-b border-l border-border pt-2 pb-6 pl-2" 
        style={{ height: chartHeight }}
      >
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
        
        <BacLegalLimitLines 
          maxBac={maxBac} 
          coordinates={coordinates} 
        />
        
        {/* Show sober time if available */}
        {soberTime && soberTime > startTime && (
          <div 
            className="absolute h-full" 
            style={{ left: `${coordinates.getXCoordinate(soberTime)}%` }}
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
    </div>
  );
};

export default BacChartGraph;
