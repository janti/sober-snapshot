
import React, { useEffect, useState } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Format time consistently across the component
  const formatTimeForDisplay = (date: Date): string => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Transform data for recharts whenever input data changes
  useEffect(() => {
    console.log("Processing new BAC data for chart, points:", data.length);
    
    if (data.length === 0) {
      setChartData([]);
      return;
    }
    
    // Get current time
    const now = new Date();
    
    // Transform data for recharts with consistent formatting
    let transformedData = data.map(point => ({
      timestamp: point.time.getTime(),
      time: formatTimeForDisplay(point.time),
      bac: point.bac,
      bacFormatted: (point.bac * 10).toFixed(1)
    }));

    // Sort data by timestamp to ensure chronological order
    transformedData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Filter to show only current and future data points
    transformedData = transformedData.filter(point => 
      point.timestamp >= now.getTime() - 5 * 60 * 1000 // Include 5 min before now for context
    );

    // If we have a sober time and it's not already in our data, add it to the chart
    if (soberTime && transformedData.length > 0) {
      const soberTimestamp = soberTime.getTime();
      
      // Check if sober time is already represented in our data points
      const soberTimeExists = transformedData.some(point => 
        Math.abs(point.timestamp - soberTimestamp) < 60 * 1000
      );
      
      // Only add the sober time point if it's not already represented
      if (!soberTimeExists && soberTimestamp > now.getTime()) {
        transformedData.push({
          timestamp: soberTimestamp,
          time: formatTimeForDisplay(soberTime),
          bac: 0.001, // Almost zero BAC at sober time
          bacFormatted: "0.0"
        });
        
        // Re-sort after adding
        transformedData.sort((a, b) => a.timestamp - b.timestamp);
      }
    }

    // Make sure the chart always extends at least 1 hour into future for better visualization
    const lastPoint = transformedData[transformedData.length - 1];
    if (lastPoint && lastPoint.timestamp < now.getTime() + 60 * 60 * 1000) {
      const oneHourLater = new Date(Math.max(
        now.getTime() + 60 * 60 * 1000,
        lastPoint.timestamp + 5 * 60 * 1000 // At least 5 minutes after last point
      ));
      
      transformedData.push({
        timestamp: oneHourLater.getTime(),
        time: formatTimeForDisplay(oneHourLater),
        bac: 0, // Assume zero BAC in future extension point
        bacFormatted: "0.0"
      });
    }
    
    // Log the generated chart data for debugging
    console.log("Chart data generated:", {
      pointCount: transformedData.length,
      timeRange: transformedData.length > 0 ? 
        `${transformedData[0].time} to ${transformedData[transformedData.length-1].time}` : 
        "none",
      soberTime: soberTime ? formatTimeForDisplay(soberTime) : "none"
    });
    
    setChartData(transformedData);
  }, [data, soberTime]);

  // Calculate max BAC for y-axis scale (with minimum of 0.1)
  const maxBac = Math.max(...(data.map(d => d.bac) || [0]), 0.1);
  
  // Calculate domain for X-axis based on data
  const getXDomain = () => {
    if (chartData.length < 2) return [0, 1]; // Default domain if no data

    return [chartData[0].timestamp, chartData[chartData.length - 1].timestamp];
  };
  
  // Calculate appropriate ticks for X-axis
  const getXTicks = () => {
    if (chartData.length < 2) return [];
    
    const ticks = [];
    const start = chartData[0].timestamp;
    const end = chartData[chartData.length - 1].timestamp;
    
    // Calculate number of ticks based on chart width
    const numberOfTicks = 6; // Adjust based on chart width
    const interval = (end - start) / (numberOfTicks - 1);
    
    for (let i = 0; i < numberOfTicks; i++) {
      ticks.push(start + i * interval);
    }
    
    return ticks;
  };
  
  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };
  
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
              domain={getXDomain()}
              scale="time"
              tickFormatter={formatXAxis}
              ticks={getXTicks()}
              tick={{ fontSize: 12, fill: "#C8C8C9" }}
              stroke="#C8C8C9"
              strokeWidth={1.5}
              allowDataOverflow={true}
            />
            <YAxis 
              tickFormatter={value => `${(value * 10).toFixed(1)}`}
              domain={[0, maxBac * 1.1]} 
              tick={{ fontSize: 12, fill: "#C8C8C9" }}
              unit="‰"
              stroke="#C8C8C9"
              strokeWidth={1.5}
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
                fontSize: '12px'
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
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
          Add drinks to see your BAC chart
        </div>
      )}
    </div>
  );
};

export default BacChartGraph;
