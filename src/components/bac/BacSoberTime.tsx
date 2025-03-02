
import React from 'react';

interface BacSoberTimeProps {
  soberTime: Date;
}

const BacSoberTime: React.FC<BacSoberTimeProps> = ({ soberTime }) => {
  const formatSoberTime = (date: Date) => {
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
  );
};

export default BacSoberTime;
