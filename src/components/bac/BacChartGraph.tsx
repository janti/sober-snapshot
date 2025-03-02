
import React, { useEffect, useState } from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
  soberTime?: Date | null;
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data, soberTime }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  // Process data whenever it changes
  useEffect(() => {
    if (data.length === 0) {
      setChartData([]);
      return;
    }

    // Transform data for recharts with consistent formatting
    const transformedData = data.map(point => ({
      timestamp: point.time.getTime(),
      time: point.time.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }),
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
          time: soberTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          }),
          bac: 0.001, // Almost zero BAC at sober time
          bacFormatted: "0.0"
        });
      }
    }

    setChartData(transformedData);
    
    console.log("Chart data updated with transformed data:", {
      dataLength: transformedData.length,
      firstPoint: transformedData.length > 0 ? transformedData[0].time : null,
      lastPoint: transformedData.length > 0 ? transformedData[transformedData.length - 1].time : null,
      soberTime: soberTime ? soberTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : null
    });
  }, [data, soberTime]);

  // Format time to show hour only (e.g., "10:00")
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Generate hourly ticks for X-axis
  const generateHourlyTicks = () => {
    if (chartData.length === 0) return [];
    
    const firstTimestamp = chartData[0].timestamp;
    const lastTimestamp = soberTime && soberTime.getTime() > chartData[chartData.length - 1].timestamp 
      ? soberTime.getTime() 
      : chartData[chartData.length - 1].timestamp;
    
    // Start with the first hour after the first data point
    const firstDate = new Date(firstTimestamp);
    // Set to the next full hour
    const startHour = new Date(
      firstDate.getFullYear(),
      firstDate.getMonth(),
      firstDate.getDate(),
      firstDate.getHours() + (firstDate.getMinutes() > 0 ? 1 : 0),
      0, 0, 0
    );
    
    const ticks = [];
    let currentTick = startHour.getTime();
    
    // Add hourly ticks until we reach beyond the last timestamp
    while (currentTick <= lastTimestamp) {
      ticks.push(currentTick);
      currentTick += 60 * 60 * 1000; // Add 1 hour
    }
    
    return ticks;
  };

  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };

  // Calculate max BAC for y-axis scale (with minimum of 0.1)
  const maxBac = Math.max(...data.map(d => d.bac), 0.1);

  // Calculate domain for X-axis on every render
  const xDomain = React.useMemo(() => {
    if (chartData.length === 0) return [0, 1];
    
    const xMin = chartData[0].timestamp;
    const xMax = soberTime && soberTime.getTime() > chartData[chartData.length - 1].timestamp
      ? soberTime.getTime()
      : chartData[chartData.length - 1].timestamp;
    
    return [xMin, xMax];
  }, [chartData, soberTime]);

  // Generate hourly ticks, recalculate on every render
  const hourlyTicks = React.useMemo(() => generateHourlyTicks(), [chartData, soberTime]);

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
