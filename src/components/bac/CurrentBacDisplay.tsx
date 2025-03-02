
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle, BadgeCheck, IceCream } from 'lucide-react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { useLanguage } from '@/context/LanguageContext';

interface CurrentBacDisplayProps {
  currentBac: number;
  onRefresh: () => void;
}

const CurrentBacDisplay: React.FC<CurrentBacDisplayProps> = ({
  currentBac,
  onRefresh
}) => {
  const { t } = useLanguage();

  // Get BAC status message and color
  const getBacStatus = () => {
    if (currentBac === 0) return { message: t('bac.status.sober'), icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.professional) return { message: t('bac.status.belowProfessional'), icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.regular) return { message: t('bac.status.belowRegular'), icon: <AlertTriangle className="h-5 w-5" />, color: "text-amber-500" };
    return { message: t('bac.status.aboveLimit'), icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-500" };
  };

  const status = getBacStatus();

  return (
    <Card className="mb-8 mx-auto max-w-md animate-fade-in shadow-lg border-2 hover:border-primary/30 transition-all duration-300">
      <CardContent className="py-6 flex flex-col items-center">
        <div className="flex items-center gap-2">
          <IceCream className="h-5 w-5 text-accent" />
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('bac.current')}
          </div>
          <IceCream className="h-5 w-5 text-accent" />
        </div>
        <div className="text-6xl font-bold mb-2 mt-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {(currentBac * 10).toFixed(1)}‰
        </div>
        <div className={`flex items-center ${status.color} font-medium gap-1.5 py-1 px-3 rounded-full bg-secondary`}>
          {status.icon}
          <span>{status.message}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRefresh} 
          className="mt-3 text-xs flex items-center gap-1 hover:bg-secondary/80"
        >
          <RefreshCw className="h-3 w-3" />
          <span>{t('bac.refresh')}</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CurrentBacDisplay;
