
import React from 'react';
import { Lollipop } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BacHeaderProps {
  title?: string;
  description?: string;
}

const BacHeader: React.FC<BacHeaderProps> = ({
  title,
  description
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="text-center mb-8 animate-slide-down">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Lollipop className="h-10 w-10 text-primary animate-pulse-slow" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title || t('app.title')}
        </h1>
        <Lollipop className="h-10 w-10 text-primary animate-pulse-slow" />
      </div>
      <p className="text-lg text-muted-foreground max-w-xl mx-auto">
        {description || t('app.description')}
      </p>
    </div>
  );
};

export default BacHeader;
