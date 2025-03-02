
import React, { useState, useEffect } from 'react';
import { 
  UserData, 
  DrinkData, 
  calculateBacOverTime,
  calculateTimeTillSober,
  getCurrentBac
} from '@/utils/bacCalculation';
import UserForm from './UserForm';
import DrinkSelector from './DrinkSelector';
import { useToast } from '@/components/ui/use-toast';
import { BacHeader, CurrentBacDisplay, ResetButton, BacSoberTime } from './bac';

const BacCalculator: React.FC = () => {
  const { toast } = useToast();
  
  // User information
  const [userData, setUserData] = useState<UserData>({
    gender: 'male',
    weight: 75
  });
  
  // Drinks list
  const [drinks, setDrinks] = useState<DrinkData[]>([]);
  
  // Time when user is estimated to be sober
  const [soberTime, setSoberTime] = useState<Date | null>(null);
  
  // Current status
  const [currentBac, setCurrentBac] = useState(0);

  // Force refresh of calculations
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Set up interval to update current BAC regularly
  useEffect(() => {
    console.log("Setting up BAC update interval");
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 30000); // Update every 30 seconds
    
    return () => {
      console.log("Clearing BAC update interval");
      clearInterval(intervalId);
    };
  }, []);
  
  // Update calculations when user data, drinks, or refresh counter changes
  useEffect(() => {
    console.log("Updating BAC calculations, drinks:", drinks.length);
    
    if (userData.weight <= 0 || drinks.length === 0) {
      setSoberTime(null);
      setCurrentBac(0);
      return;
    }
    
    // Calculate estimated sober time
    const estimatedSoberTime = calculateTimeTillSober(userData, drinks);
    
    // Get current BAC
    const currentBacValue = getCurrentBac(userData, drinks);
    setCurrentBac(currentBacValue);
    
    // Update sober time
    setSoberTime(estimatedSoberTime);
    
  }, [userData, drinks, refreshCounter]);
  
  // Handle adding a drink
  const handleAddDrink = (drink: DrinkData) => {
    console.log("Adding drink:", drink.name);
    setDrinks(prevDrinks => [...prevDrinks, drink]);
    
    // Force immediate update with new timestamp
    setRefreshCounter(Date.now());
    
    // Show toast notification
    toast({
      title: "Drink added",
      description: `${drink.name} (${drink.units.toFixed(1)} units)`,
    });
  };
  
  // Handle removing a drink
  const handleRemoveDrink = (id: string) => {
    console.log("Removing drink with ID:", id);
    setDrinks(prevDrinks => prevDrinks.filter(drink => drink.id !== id));
    
    // Force immediate update with new timestamp
    setRefreshCounter(Date.now());
  };
  
  // Handle resetting the calculator
  const handleReset = () => {
    console.log("Resetting calculator");
    setDrinks([]);
    setCurrentBac(0);
    setSoberTime(null);
    
    toast({
      title: "Calculator reset",
      description: "All drinks have been cleared",
    });
  };

  // Update BAC calculation when the component is first loaded or on manual refresh
  const refreshCalculations = () => {
    console.log("Manual refresh triggered");
    setRefreshCounter(Date.now());
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Main header */}
      <BacHeader 
        title="Drink Tracker" 
        description="Track your Blood Alcohol Content (BAC) and see how long until you're safe to drive" 
      />
      
      {/* Current BAC display */}
      <CurrentBacDisplay 
        currentBac={currentBac} 
        onRefresh={refreshCalculations} 
      />
      
      {/* Main content */}
      <div className="space-y-6 mb-8">
        {/* User information */}
        <UserForm 
          userData={userData} 
          onChange={setUserData} 
        />
        
        {/* Drink selection */}
        <DrinkSelector 
          drinks={drinks}
          onAddDrink={handleAddDrink}
          onRemoveDrink={handleRemoveDrink}
          onClearDrinks={handleReset}
        />
        
        {/* Display sober time if available */}
        {soberTime && <BacSoberTime soberTime={soberTime} />}
      </div>
      
      {/* Reset button */}
      <ResetButton onReset={handleReset} />
    </div>
  );
};

export default BacCalculator;
