
import React from 'react';
import BacCalculator from '@/components/BacCalculator';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

const Index = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme based on system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleTheme}
          className="rounded-full w-10 h-10 shadow-lg bg-background"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      <div className="container py-8 px-4 sm:py-12">
        <BacCalculator />
        
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p className="mb-1">
            This calculator is for educational purposes only and should not be used to determine fitness to drive.
          </p>
          <p>
            Always drink responsibly and never drive under the influence of alcohol.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
