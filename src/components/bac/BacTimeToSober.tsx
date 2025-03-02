
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CandyCane } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BacTimeToSoberProps {
  soberTime: Date | null;
}

const BacTimeToSober: React.FC<BacTimeToSoberProps> = ({ soberTime }) => {
  const { t } = useLanguage();
  
  const formatTimeRemaining = (date: Date | null) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    // Already sober
    if (diffMs < 0) return t('time.youAreSober');
    
    // Less than a minute remaining
    if (diffMs < 60000) return t('time.lessThanMinute');
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    if (diffHours > 0) {
      result += `${diffHours} ${diffHours === 1 ? t('time.hour') : t('time.hours')} `;
    }
    if (diffMinutes > 0 || diffHours === 0) {
      result += `${diffMinutes} ${diffMinutes === 1 ? t('time.minute') : t('time.minutes')}`;
    }
    
    return result;
  };

  if (!soberTime) return null;

  return (
    <Card className="mb-6 animate-fade-in shadow-md hover:shadow-lg transition-all duration-300 border-accent/20">
      <CardContent className="py-4 px-5">
        <div className="flex items-center gap-2 mb-2">
          <CandyCane className="h-5 w-5 text-accent" />
          <h3 className="font-medium">{t('time.untilSober')}</h3>
        </div>
        <div className="text-2xl font-bold text-primary">
          {formatTimeRemaining(soberTime)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {t('time.soberAt')} {soberTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BacTimeToSober;
