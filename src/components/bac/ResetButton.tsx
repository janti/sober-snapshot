
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Candy } from 'lucide-react';

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
        className="flex items-center gap-2 border-2 hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-300"
      >
        <Candy className="h-4 w-4 text-accent" />
        <span>Reset Calculator</span>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ResetButton;
