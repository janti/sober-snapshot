
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { CarFront, CarTaxiFront } from 'lucide-react';

interface BacChartProps {
  data: { time: Date; bac: number }[];
  soberTime: Date | null;
  className?: string;
}

const BacChart: React.FC<BacChartProps> = ({ data, soberTime, className }) => {
  // Ensure data is properly formatted for the chart
  const chartData = data.map(point => ({
    time: point.time,
    timeFormatted: point.time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    }),
    bac: point.bac,
    bacFormatted: (point.bac * 10).toFixed(1) // Convert to permille for display
  }));

  const currentBac = data.length > 0 ? data[data.length - 1].bac : 0;
  // Ensure we have a reasonable scale that won't collapse when BAC is very low
  const maxBac = Math.max(...data.map(d => d.bac), 0.1); // Ensure at least 0.1 for scale
  
  const isAboveRegularLimit = currentBac > LEGAL_LIMITS.regular;
  const isAboveProfessionalLimit = currentBac > LEGAL_LIMITS.professional;

  const formatXAxis = (tickItem: Date) => {
    return tickItem.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTooltipValue = (value: number) => {
    return `${(value * 10).toFixed(1)}‰`;
  };

  const formatSoberTime = (date: Date | null) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    // Less than a minute remaining
    if (diffMs < 60000) return 'Less than a minute';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    if (diffHours > 0) {
      result += `${diffHours} hour${diffHours > 1 ? 's' : ''} `;
    }
    if (diffMinutes > 0 || diffHours === 0) {
      result += `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
    
    return result;
  };

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-medium">
              BAC Over Time
            </CardTitle>
            <CardDescription>
              Blood Alcohol Concentration visualization
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge 
              variant={isAboveRegularLimit ? "destructive" : "outline"}
              className="flex gap-1 items-center"
            >
              <CarFront className="h-3 w-3" />
              <span>{(LEGAL_LIMITS.regular * 10).toFixed(1)}‰ limit</span>
            </Badge>
            <Badge 
              variant={isAboveProfessionalLimit ? "destructive" : "outline"}
              className="flex gap-1 items-center"
            >
              <CarTaxiFront className="h-3 w-3" />
              <span>{(LEGAL_LIMITS.professional * 10).toFixed(1)}‰ limit</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64 w-full">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="bacColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.7} />
                <XAxis 
                  dataKey="time" 
                  tickFormatter={formatXAxis} 
                  tick={{ fontSize: 12 }}
                  stroke="var(--muted-foreground)"
                  tickLine={{ stroke: 'var(--muted-foreground)' }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  allowDataOverflow
                />
                <YAxis 
                  tickFormatter={value => `${(value * 10).toFixed(1)}`}
                  domain={[0, maxBac * 1.1]} 
                  tick={{ fontSize: 12 }}
                  unit="‰"
                  stroke="var(--muted-foreground)"
                  tickLine={{ stroke: 'var(--muted-foreground)' }}
                  allowDecimals={true}
                  minTickGap={10}
                />
                <Tooltip 
                  formatter={formatTooltipValue}
                  labelFormatter={value => {
                    if (value instanceof Date) {
                      return value.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                    }
                    return value;
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--background)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
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
                  stroke="var(--primary)" 
                  fill="url(#bacColor)" 
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={500}
                  activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'var(--background)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data to display yet. Add some drinks to see your BAC chart.
            </div>
          )}
        </div>

        {soberTime && data.length > 0 && (
          <div className="p-4 bg-secondary rounded-lg">
            <div className="text-sm font-medium">Time until sober (BAC &lt; 0.01%)</div>
            <div className="text-2xl font-bold mt-1">{formatSoberTime(soberTime)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Estimated sober at {soberTime.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BacChart;
