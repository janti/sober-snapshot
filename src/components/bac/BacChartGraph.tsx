
import React from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface BacChartGraphProps {
  data: { time: Date; bac: number }[];
}

const BacChartGraph: React.FC<BacChartGraphProps> = ({ data }) => {
  // Transform the data for the chart with proper time formatting
  const chartData = data.map(point => ({
    timestamp: point.time.getTime(),
    time: point.time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    }),
    bac: point.bac,
    bacFormatted: (point.bac * 10).toFixed(1)
  }));

  // Calculate max BAC for y-axis scale (with minimum of 0.1)
  const maxBac = Math.max(...data.map(d => d.bac), 0.1);

  // Functions for formatting chart values
  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };

  // Explicitly set X-axis domain to ensure it shows the full time range
  const xDomain = chartData.length > 0 ? 
    [chartData[0].timestamp, chartData[chartData.length - 1].timestamp] : 
    ['dataMin', 'dataMax'];
    
  // Calculate time range to determine tick frequency
  const timeRange = chartData.length > 1 ? 
    chartData[chartData.length - 1].timestamp - chartData[0].timestamp : 
    0;
    
  // For short time spans, use more frequent ticks
  const minTickGap = timeRange < 3600000 ? 5 : 15; // 1 hour threshold

  // Use a unique key for the ResponsiveContainer based on data length and timestamps
  // This forces React to completely remount the chart when data changes significantly
  const containerKey = `chart-${data.length}-${data.length > 0 ? data[0].time.getTime() : 0}-${data.length > 0 ? data[data.length-1].time.getTime() : 0}`;

  return (
    <div className="h-64 w-full">
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height="100%" key={containerKey}>
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
              tickFormatter={formatXAxis} 
              tick={{ fontSize: 12, fill: "#C8C8C9" }}
              stroke="#C8C8C9"
              strokeWidth={1.5}
              tickLine={{ stroke: '#C8C8C9', strokeWidth: 1.5 }}
              domain={xDomain}
              type="number"
              scale="time"
              allowDataOverflow
              minTickGap={minTickGap}
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
              minTickGap={10}
            />
            <Tooltip 
              formatter={formatTooltipValue}
              labelFormatter={(value) => {
                return formatXAxis(value as number);
              }}
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
