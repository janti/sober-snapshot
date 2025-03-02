
import React from 'react';
import { LEGAL_LIMITS } from '@/utils/bacCalculation';
import { ChartCoordinates } from './types';

interface BacLegalLimitLinesProps {
  maxBac: number;
  coordinates: ChartCoordinates;
}

export const BacLegalLimitLines: React.FC<BacLegalLimitLinesProps> = ({ 
  maxBac, 
  coordinates 
}) => {
  // Get y-coordinate for each limit line
  const regularLimitY = coordinates.getYCoordinate(LEGAL_LIMITS.regular);
  const professionalLimitY = coordinates.getYCoordinate(LEGAL_LIMITS.professional);
  
  return (
    <>
      {/* Draw legal limit lines only if they're within the visible range */}
      {LEGAL_LIMITS.regular <= maxBac && (
        <div 
          className="absolute w-full border-t-2 border-dashed border-destructive border-opacity-70"
          style={{ 
            top: `${regularLimitY}px`,
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
            top: `${professionalLimitY}px`,
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
