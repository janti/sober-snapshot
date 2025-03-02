
import React from 'react';

interface BacHeaderProps {
  title: string;
  description: string;
}

const BacHeader: React.FC<BacHeaderProps> = ({
  title,
  description
}) => {
  return (
    <div className="text-center mb-8 animate-slide-down">
      <h1 className="text-4xl font-bold mb-2">{title}</h1>
      <p className="text-lg text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default BacHeader;
