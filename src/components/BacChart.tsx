
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { CarFront, CarTaxiFront, IceCreamCone } from 'lucide-react';

interface BacChartProps {
  data: { time: Date; bac: number }[];
  soberTime: Date | null;
  className?: string;
}

const BacChart: React.FC<BacChartProps> = ({ data, soberTime, className }) => {
  const chartData = data.map(point => ({
    timestamp: point.time.getTime(),
    time: point.time.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    }),
    bac: point.bac,
    bacFormatted: (point.bac * 10).toFixed(1)
  }));

  const currentBac = data.length > 0 ? data[data.length - 1].bac : 0;
  const maxBac = Math.max(...data.map(d => d.bac), 0.1);
  
  const isAboveRegularLimit = currentBac > LEGAL_LIMITS.regular;
  const isAboveProfessionalLimit = currentBac > LEGAL_LIMITS.professional;

  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
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
    
    if (diffMs < 60000) return 'Less than a minute';
    
    if (diffMs < 0) return 'You are sober now';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    if (diffHours > 0) {
      result += `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} `;
    }
    if (diffMinutes > 0 || diffHours === 0) {
      result += `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return result;
  };

  return (
    <Card className={`animate-fade-in shadow-lg border-2 hover:border-primary/30 transition-all duration-300 ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <IceCreamCone className="h-5 w-5 text-accent" />
              <CardTitle className="text-xl font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Blood Alcohol Chart
              </CardTitle>
            </div>
            <CardDescription>
              Track your Blood Alcohol Content (BAC) over time
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge 
              variant={isAboveRegularLimit ? "destructive" : "outline"}
              className="flex gap-1 items-center shadow-sm"
            >
              <CarFront className="h-3 w-3" />
              <span>{(LEGAL_LIMITS.regular * 10).toFixed(1)}‰ Regular Limit</span>
            </Badge>
            <Badge 
              variant={isAboveProfessionalLimit ? "destructive" : "outline"}
              className="flex gap-1 items-center shadow-sm"
            >
              <CarTaxiFront className="h-3 w-3" />
              <span>{(LEGAL_LIMITS.professional * 10).toFixed(1)}‰ Professional Limit</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  tickFormatter={formatXAxis} 
                  tick={{ fontSize: 12, fill: "#C8C8C9" }}
                  stroke="#C8C8C9"
                  strokeWidth={1.5}
                  tickLine={{ stroke: '#C8C8C9', strokeWidth: 1.5 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  allowDataOverflow
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
                  isAnimationActive={true}
                  animationDuration={500}
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

        {soberTime && data.length > 0 && (
          <div className="p-4 bg-secondary rounded-lg shadow-inner">
            <div className="text-sm font-medium">Time until sober</div>
            <div className="text-2xl font-bold mt-1 text-primary">{formatSoberTime(soberTime)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Sober at {soberTime.toLocaleTimeString([], { 
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
