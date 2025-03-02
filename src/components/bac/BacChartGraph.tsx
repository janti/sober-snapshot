import React, { useEffect, useState, useRef, useMemo } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Use refs to minimize re-renders while still tracking changes
  const dataRef = useRef<{ time: Date; bac: number }[]>([]);
  const soberTimeRef = useRef<Date | null>(null);
  const chartDataRef = useRef<any[]>([]);
  const lastUpdateRef = useRef<number>(0);
  
  // Format time consistently across the component
  const formatTimeForDisplay = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Deep compare function for data arrays to prevent unnecessary updates
  const hasDataChanged = (oldData: any[], newData: any[]): boolean => {
    if (oldData.length !== newData.length) return true;
    
    // First check time values and length
    if (oldData.length !== newData.length) return true;
    
    // Check if soberTime changed
    const oldSoberTime = soberTimeRef.current?.getTime();
    const newSoberTime = soberTime?.getTime();
    if (oldSoberTime !== newSoberTime) return true;
    
    // Check if enough time has passed since last update (at least 5 seconds)
    const now = Date.now();
    if (now - lastUpdateRef.current > 5000) return true;
    
    // If lengths are same but both are 0, consider it unchanged
    if (oldData.length === 0 && newData.length === 0) return false;
    
    // Extra step: explicitly check the first and last data points
    if (oldData.length > 0 && newData.length > 0) {
      const firstNew = newData[0].time.getTime();
      const firstOld = oldData[0].time.getTime();
      const lastNew = newData[newData.length - 1].time.getTime();
      const lastOld = oldData[oldData.length - 1].time.getTime();
      
      if (Math.abs(firstNew - firstOld) > 1000 || Math.abs(lastNew - lastOld) > 1000) {
        return true;
      }
    }
    
    return false;
  };

  // Transform data for recharts whenever input data changes
  useEffect(() => {
    // Skip update if nothing meaningful changed to prevent re-renders
    if (!hasDataChanged(dataRef.current, data) && chartData.length > 0) {
      return;
    }
    
    console.log("Updating chart data with new values, data length:", data.length);
    
    // Update refs
    dataRef.current = [...data];
    soberTimeRef.current = soberTime || null;
    lastUpdateRef.current = Date.now();
    
    if (data.length === 0) {
      setChartData([]);
      chartDataRef.current = [];
      return;
    }
    
    // Get current time
    const now = new Date();
    
    // Transform data for recharts with consistent formatting
    const transformedData = data.map(point => ({
      timestamp: point.time.getTime(),
      time: formatTimeForDisplay(point.time),
      bac: point.bac,
      bacFormatted: (point.bac * 10).toFixed(1)
    }));

    // Sort data by timestamp to ensure chronological order
    transformedData.sort((a, b) => a.timestamp - b.timestamp);

    // Filter to only show current time forward
    const filteredData = transformedData.filter(point => {
      // Only show points from current time onward or 5 minutes before for context
      return point.timestamp >= now.getTime() - 5 * 60 * 1000;
    });

    // If we have a sober time and it's not already in our data, add it to the chart
    if (soberTime && filteredData.length > 0) {
      const soberTimestamp = soberTime.getTime();
      const lastDataPoint = filteredData[filteredData.length - 1];
      
      // Only add the sober time point if it's in the future and not already represented
      if (soberTimestamp > now.getTime() && soberTimestamp > lastDataPoint.timestamp) {
        filteredData.push({
          timestamp: soberTimestamp,
          time: formatTimeForDisplay(soberTime),
          bac: 0.001, // Almost zero BAC at sober time
          bacFormatted: "0.0"
        });
      }
    }

    // Make sure we have at least the current time point
    const hasCurrentTime = filteredData.some(
      point => Math.abs(point.timestamp - now.getTime()) < 60 * 1000
    );

    if (!hasCurrentTime && filteredData.length > 0) {
      // Find or interpolate BAC value for current time
      let currentBac = 0;
      
      // Find points before and after current time
      const beforePoints = transformedData.filter(p => p.timestamp <= now.getTime());
      const afterPoints = transformedData.filter(p => p.timestamp > now.getTime());
      
      if (beforePoints.length > 0 && afterPoints.length > 0) {
        // We can interpolate
        const beforePoint = beforePoints[beforePoints.length - 1];
        const afterPoint = afterPoints[0];
        
        // Linear interpolation
        const timeFraction = (now.getTime() - beforePoint.timestamp) / 
                            (afterPoint.timestamp - beforePoint.timestamp);
        currentBac = beforePoint.bac + timeFraction * (afterPoint.bac - beforePoint.bac);
      } else if (beforePoints.length > 0) {
        // Use the last point before now
        currentBac = beforePoints[beforePoints.length - 1].bac;
      } else if (afterPoints.length > 0) {
        // Use the first point after now
        currentBac = afterPoints[0].bac;
      }
      
      // Add the current time point
      filteredData.push({
        timestamp: now.getTime(),
        time: formatTimeForDisplay(now),
        bac: currentBac,
        bacFormatted: (currentBac * 10).toFixed(1)
      });
      
      // Re-sort to maintain chronological order
      filteredData.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Ensure we have future data points for a meaningful chart
    if (filteredData.length <= 1) {
      // Add a point 1 hour from now with same BAC (or declining if above 0)
      const currentBac = filteredData.length > 0 ? filteredData[0].bac : 0;
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const bacOneHourLater = Math.max(0, currentBac - 0.015); // Subtract metabolism rate
      
      filteredData.push({
        timestamp: oneHourLater.getTime(),
        time: formatTimeForDisplay(oneHourLater),
        bac: bacOneHourLater,
        bacFormatted: (bacOneHourLater * 10).toFixed(1)
      });
    }
    
    // Update state and ref
    chartDataRef.current = filteredData;
    setChartData(filteredData);
    
    console.log("Chart data updated:", {
      currentTime: formatTimeForDisplay(now),
      dataLength: filteredData.length,
      firstPoint: filteredData.length > 0 ? filteredData[0].time : "none",
      lastPoint: filteredData.length > 0 ? filteredData[filteredData.length - 1].time : "none",
      soberTime: soberTime ? formatTimeForDisplay(soberTime) : "None"
    });
  }, [data, soberTime, chartData.length]);

  // Calculate hourly ticks for X-axis with even hour intervals
  const getHourlyTicks = () => {
    if (chartData.length === 0) return [];
    
    // Get current time - use a fresh instance to ensure it's up-to-date
    const now = new Date();
    
    // Find the nearest future whole hour
    const nextWholeHour = new Date(now);
    // Go to next whole hour (e.g., 10:00, 11:00)
    nextWholeHour.setHours(nextWholeHour.getHours() + (nextWholeHour.getMinutes() > 0 ? 1 : 0), 0, 0, 0);
    
    // Find the latest timestamp in our data
    const lastTimestamp = chartData[chartData.length - 1].timestamp;
    
    // Generate ticks
    const ticks = [];
    
    // Always add current time as first tick
    ticks.push(now.getTime());
    
    // Add hourly ticks at whole hours
    let currentTick = nextWholeHour.getTime();
    while (currentTick <= lastTimestamp + (15 * 60 * 1000)) {
      ticks.push(currentTick);
      currentTick += 60 * 60 * 1000; // Add 1 hour
    }
    
    return ticks;
  };

  // Calculate domain for X-axis, ensuring it starts from current time
  const getXDomain = () => {
    if (chartData.length === 0) return [0, 1];
    
    // Use a fresh instance to ensure it's up-to-date
    const now = new Date();
    
    // Start domain exactly at current time
    const xMin = now.getTime();
    
    // End domain at the last data point plus a small buffer
    const xMax = Math.max(
      chartData[chartData.length - 1].timestamp,
      now.getTime() + 60 * 60 * 1000 // At least 1 hour from now
    );
    
    return [xMin, xMax + (15 * 60 * 1000)]; // Add 15 minutes padding at end
  };

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };

  // Calculate max BAC for y-axis scale (with minimum of 0.1)
  const maxBac = Math.max(...(data.map(d => d.bac) || [0]), 0.1);

  // Calculate ticks and domain using useMemo to prevent unnecessary recalculations
  const hourlyTicks = useMemo(() => getHourlyTicks(), [chartData]);
  const xDomain = useMemo(() => getXDomain(), [chartData]);
  
  // Format function for X-axis
  const formatXAxis = (timestamp: number) => {
    return formatTimeForDisplay(new Date(timestamp));
  };

  return (
    <div className="h-64 w-full">
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <defs>
              <linearGradient id="bacColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.7} />
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={xDomain}
              scale="time"
              tickFormatter={formatXAxis}
              ticks={hourlyTicks}
              tick={{ fontSize: 12, fill: "#C8C8C9" }}
              stroke="#C8C8C9"
              strokeWidth={1.5}
              tickLine={{ stroke: '#C8C8C9', strokeWidth: 1.5 }}
              allowDataOverflow={true}
            />
            <YAxis 
              tickFormatter={value => `${(value * 10).toFixed(1)}`}
              domain={[0, maxBac * 1.1]} 
              tick={{ fontSize: 12, fill: "#C8C8C9" }}
              unit="‰"
              stroke="#C8C8C9"
              strokeWidth={1.5}
              tickLine={{ stroke: '#C8C8C9', strokeWidth: 1.5 }}
              allowDecimals={true}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(value) => formatXAxis(value as number)}
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
              isAnimationActive={false}
            />
            <ReferenceLine 
              y={LEGAL_LIMITS.regular} 
              stroke="#f43f5e" 
              strokeDasharray="3 3" 
              label={{ 
                value: "Regular Limit",
                position: "insideBottomRight",
                fill: "#f43f5e",
                fontSize: 10
              }}
            />
            <ReferenceLine 
              y={LEGAL_LIMITS.professional} 
              stroke="#f59e0b" 
              strokeDasharray="3 3" 
              label={{ 
                value: "Professional Limit",
                position: "insideBottomRight",
                fill: "#f59e0b",
                fontSize: 10
              }}
            />
            <Area 
              type="monotone" 
              dataKey="bac" 
              stroke="hsl(var(--primary))" 
              fill="url(#bacColor)" 
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'var(--background)' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          {data.length === 0 
            ? "Add drinks to see your BAC chart" 
            : "Add more drinks to see a detailed chart"}
        </div>
      )}
    </div>
  );
};

export default BacChartGraph;
