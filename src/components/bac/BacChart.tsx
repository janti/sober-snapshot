import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CarFront, CarTaxiFront, IceCreamCone } from 'lucide-react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { BacChartGraph } from './chart';
import BacSoberTime from './BacSoberTime';

interface BacChartProps {
  data: { time: Date; bac: number }[];
  soberTime: Date | null;
  className?: string;
}

const BacChart: React.FC<BacChartProps> = ({ data, soberTime, className }) => {
  const currentBac = data.length > 0 ? data[data.length - 1].bac : 0;
  
  const isAboveRegularLimit = currentBac > LEGAL_LIMITS.regular;
  const isAboveProfessionalLimit = currentBac > LEGAL_LIMITS.professional;

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
        <BacChartGraph data={data} soberTime={soberTime} />
        {soberTime && data.length > 0 && (
          <BacSoberTime soberTime={soberTime} />
        )}
      </CardContent>
    </Card>
  );
};

export default BacChart;
