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
      setChartData([{
        time: now,
        bac: currentBac
      }, {
        time: soberTime,
        bac: 0
      }]);
    } else {
      // If no sober time or already sober, use a flat line for 3 hours
      const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      setChartData([{
        time: now,
        bac: currentBac
      }, {
        time: threeHoursLater,
        bac: currentBac
      }]);
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
    return <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Add drinks to see your BAC chart
      </div>;
  }

  // Calculate max BAC for y-axis (with minimum of 0.08 to ensure proper visualization)
  const maxBac = Math.max(0.08, ...chartData.map(d => d.bac * 1.2));

  // Get current time
  const now = new Date();

  // Define time range for x-axis
  const startTime = now;
  const endTime = soberTime && soberTime > now ? soberTime : new Date(now.getTime() + 3 * 60 * 60 * 1000);

  // Calculate total duration in hours
  const totalHours = Math.max(3, (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000));

  // Generate time markers for x-axis
  const hourMarks: Date[] = [];

  // Start with current time (now)
  hourMarks.push(new Date(now));

  // Add hour markers at regular intervals
  let currentHour = new Date(now);
  // Round to the next hour
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);

  // Determine interval based on total hours
  let hourInterval = 1; // Default to 1 hour intervals
  if (totalHours > 12) {
    hourInterval = 3;
  } else if (totalHours > 6) {
    hourInterval = 2;
  }

  // Add the next rounded hour if it's at least 15 minutes away
  if (nextHour.getTime() - now.getTime() > 15 * 60 * 1000) {
    hourMarks.push(new Date(nextHour));
    currentHour = new Date(nextHour);
  }

  // Add remaining hours
  while (hourMarks.length < 6 && currentHour < endTime) {
    const nextTime = new Date(currentHour.getTime() + hourInterval * 60 * 60 * 1000);
    if (nextTime <= endTime) {
      hourMarks.push(nextTime);
    }
    currentHour = nextTime;
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
  for (let level = bacInterval; level <= maxBac; level += bacInterval) {
    bacMarks.push(parseFloat(level.toFixed(4))); // Fix floating point precision
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
      const percentage = timePosition / totalTimeRange * 100;

      // Apply left padding
      return leftPadding / 100 * (100 - leftPadding) + percentage / 100 * (100 - leftPadding);
    },
    getYCoordinate(bac: number): number {
      // Invert y-coordinate (0 at bottom, maxBac at top)
      return chartHeight - bac / maxBac * chartHeight;
    }
  };
  return <div className="w-full h-[230px] relative mb-2 mx-[10px]">
      {/* Chart container */}
      <div className="absolute inset-0 border-b border-l border-border pt-2 pb-6 pl-2" style={{
      height: chartHeight
    }}>
        
        <BacAxisLabels hourMarks={hourMarks} bacMarks={bacMarks} formatTime={formatTime} chartHeight={chartHeight} leftPadding={leftPadding} totalHours={totalHours} startTime={startTime} coordinates={coordinates} />
        
        <BacLegalLimitLines maxBac={maxBac} coordinates={coordinates} />
        
        {/* Show sober time if available */}
        {soberTime && soberTime > startTime && <div className="absolute h-full" style={{
        left: `${coordinates.getXCoordinate(soberTime)}%`
      }}>
            <div className="h-full w-px bg-green-500 opacity-70 dashed-border z-10"></div>
            <div className="absolute bottom-[-24px] transform -translate-x-1/2">
              <span className="text-xs text-green-500 font-medium whitespace-nowrap">
                Sober
              </span>
            </div>
          </div>}

        <BacLineGraph chartData={chartData} chartHeight={chartHeight} coordinates={coordinates} />
      </div>
    </div>;
};
export default BacChartGraph;