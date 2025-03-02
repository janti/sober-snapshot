
import React from 'react';
import { Lollipop } from 'lucide-react';

interface BacHeaderProps {
  title?: string;
  description?: string;
}

const BacHeader: React.FC<BacHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div className="text-center mb-8 animate-slide-down">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Lollipop className="h-10 w-10 text-primary animate-pulse-slow" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title || 'Drink Tracker'}
        </h1>
        <Lollipop className="h-10 w-10 text-primary animate-pulse-slow" />
      </div>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        {description || 'Track your Blood Alcohol Content (BAC) and enjoy responsibly! This app shows you when it\'s safe to drive.'}
      </p>
    </div>
  );
};

export default BacHeader;
