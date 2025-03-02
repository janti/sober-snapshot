
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
}

const ResetButton: React.FC<ResetButtonProps> = ({ onReset }) => {
  return (
    <div className="flex justify-center mb-12">
      <Button 
        onClick={onReset} 
        variant="outline" 
        size="lg"
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Reset Calculator</span>
      </Button>
    </div>
  );
};

export default ResetButton;
