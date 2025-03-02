import React, { useEffect, useState } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  // Transform data for recharts whenever input data changes
  useEffect(() => {
    if (data.length === 0) {
      setChartData([]);
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

    // If we have a sober time and it's not already in our data, add it to the chart
    if (soberTime && transformedData.length > 0) {
      const soberTimestamp = soberTime.getTime();
      const lastDataPoint = transformedData[transformedData.length - 1];
      
      // Only add the sober time point if it's in the future and not already represented
      if (soberTimestamp > lastDataPoint.timestamp) {
        transformedData.push({
          timestamp: soberTimestamp,
          time: formatTimeForDisplay(soberTime),
          bac: 0.001, // Almost zero BAC at sober time
          bacFormatted: "0.0"
        });
      }
    }

    // Filter out data points from the past (before current time)
    const filteredData = transformedData.filter(point => {
      // Keep a few past points for context (last 30 minutes)
      return point.timestamp >= now.getTime() - 30 * 60 * 1000;
    });

    // Make sure we have at least one data point
    if (filteredData.length === 0 && transformedData.length > 0) {
      // If all points were filtered out, keep the most recent one
      filteredData.push(transformedData[transformedData.length - 1]);
    }
    
    setChartData(filteredData);
    
    console.log("Chart data updated:", {
      currentTime: formatTimeForDisplay(now),
      dataPoints: filteredData.length,
      timeRange: filteredData.length > 0 ? 
        `${filteredData[0].time} - ${filteredData[filteredData.length - 1].time}` : 
        "No data",
      soberTime: soberTime ? formatTimeForDisplay(soberTime) : "None"
    });
  }, [data, soberTime]);

  // Format time consistently across the component
  const formatTimeForDisplay = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Format timestamp for X-axis display
  const formatXAxis = (timestamp: number) => {
    return formatTimeForDisplay(new Date(timestamp));
  };

  // Calculate hourly ticks for X-axis
  const getHourlyTicks = () => {
    if (chartData.length === 0) return [];
    
    // Find the earliest and latest timestamps in our data
    const firstTimestamp = chartData[0].timestamp;
    const lastTimestamp = chartData[chartData.length - 1].timestamp;
    
    const startDate = new Date(firstTimestamp);
    
    // Round to the previous full hour
    const startHour = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startDate.getHours(),
      0, 0, 0
    );
    
    // Generate hourly ticks
    const ticks = [];
    let currentTick = startHour.getTime();
    
    // Add hourly ticks until we reach beyond the last timestamp
    while (currentTick <= lastTimestamp + (60 * 60 * 1000)) { // Add one extra hour for better visibility
      ticks.push(currentTick);
      currentTick += 60 * 60 * 1000; // Add 1 hour
    }
    
    return ticks;
  };

  // Calculate domain for X-axis
  const getXDomain = () => {
    if (chartData.length === 0) return [0, 1];
    
    const xMin = chartData[0].timestamp;
    const xMax = chartData[chartData.length - 1].timestamp;
    
    // Extend the domain slightly for better visualization
    return [xMin, xMax + (15 * 60 * 1000)]; // Add 15 minutes to the end
  };

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };

  // Calculate max BAC for y-axis scale (with minimum of 0.1)
  const maxBac = Math.max(...data.map(d => d.bac), 0.1);

  // Calculate ticks and domain only when chart data changes
  const hourlyTicks = getHourlyTicks();
  const xDomain = getXDomain();

  return (
    <div className="h-64 w-full">
      {chartData.length > 1 ? (
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
              allowDataOverflow={false}
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
