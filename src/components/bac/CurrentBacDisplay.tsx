
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, BadgeCheck } from 'lucide-react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';

interface CurrentBacDisplayProps {
  currentBac: number;
  onRefresh: () => void;
}

const CurrentBacDisplay: React.FC<CurrentBacDisplayProps> = ({
  currentBac,
  onRefresh
}) => {
  // Get BAC status message and color
  const getBacStatus = () => {
    if (currentBac === 0) return { message: "Sober", icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.professional) return { message: "Below Professional Limit", icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.regular) return { message: "Below Regular Limit", icon: <AlertTriangle className="h-5 w-5" />, color: "text-amber-500" };
    return { message: "Above Legal Limit", icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-500" };
  };

  const status = getBacStatus();

  return (
    <Card className="mb-8 mx-auto max-w-md animate-fade-in">
      <CardContent className="py-6 flex flex-col items-center">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Current BAC
        </div>
        <div className="text-6xl font-bold mb-2 mt-2">
          {(currentBac * 10).toFixed(1)}‰
        </div>
        <div className={`flex items-center ${status.color} font-medium gap-1.5`}>
          {status.icon}
          <span>{status.message}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh} 
          className="mt-3 text-xs flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Refresh</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CurrentBacDisplay;
