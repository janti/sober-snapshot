
import React from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';

interface BacLegalLimitLinesProps {
  maxBac: number;
}

export const BacLegalLimitLines: React.FC<BacLegalLimitLinesProps> = ({ maxBac }) => {
  // Calculate position for each limit line based on percentage of max BAC
  const regularLimitPosition = 100 - (LEGAL_LIMITS.regular / maxBac) * 100;
  const professionalLimitPosition = 100 - (LEGAL_LIMITS.professional / maxBac) * 100;
  
  return (
    <>
      {/* Draw legal limit lines only if they're within the visible range */}
      {LEGAL_LIMITS.regular <= maxBac && (
        <div 
          className="absolute w-full border-t-2 border-dashed border-destructive border-opacity-70"
          style={{ 
            top: `${regularLimitPosition}%`,
            zIndex: 5
          }}
        >
          <span className="absolute right-0 -top-5 text-xs text-destructive whitespace-nowrap">
            {(LEGAL_LIMITS.regular * 10).toFixed(1)}‰
          </span>
        </div>
      )}
      
      {LEGAL_LIMITS.professional <= maxBac && (
        <div 
          className="absolute w-full border-t-2 border-dashed border-amber-500 border-opacity-70"
          style={{ 
            top: `${professionalLimitPosition}%`,
            zIndex: 5
          }}
        >
          <span className="absolute right-0 -top-5 text-xs text-amber-500 whitespace-nowrap">
            {(LEGAL_LIMITS.professional * 10).toFixed(1)}‰
          </span>
        </div>
      )}
    </>
  );
};
