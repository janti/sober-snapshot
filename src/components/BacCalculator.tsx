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
import { BacChart, CurrentBacDisplay, BacHeader, ResetButton } from './bac';

const BacCalculator: React.FC = () => {
  const { toast } = useToast();
  
  // User information
  const [userData, setUserData] = useState<UserData>({
    gender: 'male',
    weight: 75
  });
  
  // Drinks list
  const [drinks, setDrinks] = useState<DrinkData[]>([]);
  
  // BAC data for the chart
  const [bacData, setBacData] = useState<{ time: Date; bac: number }[]>([]);
  
  // Time when user is estimated to be sober
  const [soberTime, setSoberTime] = useState<Date | null>(null);
  
  // Current status
  const [currentBac, setCurrentBac] = useState(0);

  // Force refresh of calculations
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());
  
  // Set up interval to update current BAC regularly
  useEffect(() => {
    console.log("Setting up BAC update interval");
    const intervalId = setInterval(() => {
      console.log("Interval update triggered");
      setRefreshTrigger(Date.now()); // Use timestamp for better trigger
    }, 2000); // Update even more frequently (2 seconds) for responsive chart
    
    return () => {
      console.log("Clearing BAC update interval");
      clearInterval(intervalId);
    };
  }, []);
  
  // Update calculations when user data or drinks change
  useEffect(() => {
    console.log("Updating BAC calculations, drinks:", drinks.length, "refreshTrigger:", refreshTrigger);
    
    if (userData.weight <= 0 || drinks.length === 0) {
      setBacData([]);
      setSoberTime(null);
      setCurrentBac(0);
      return;
    }
    
    // Calculate BAC over time for the chart
    const startTime = drinks.length > 0 
      ? new Date(Math.min(...drinks.map(d => d.timestamp.getTime())))
      : new Date();
      
    // Look ahead 12 hours maximum
    const endTime = new Date(Math.max(
      new Date().getTime() + 30 * 60 * 1000, // At least 30 minutes into future for better visualization
      startTime.getTime() + 12 * 60 * 60 * 1000
    ));
    
    const bacPoints = calculateBacOverTime(userData, drinks, startTime, endTime, 5); // Increase data point frequency to 5 min
    setBacData(bacPoints);
    
    // Get current BAC using dedicated function
    const currentBacValue = getCurrentBac(userData, drinks);
    console.log("Updated current BAC:", currentBacValue);
    setCurrentBac(currentBacValue);
    
    // Calculate time until sober
    const estimatedSoberTime = calculateTimeTillSober(userData, drinks);
    console.log("Updated sober time:", estimatedSoberTime);
    setSoberTime(estimatedSoberTime);
    
  }, [userData, drinks, refreshTrigger]);
  
  // Handle adding a drink
  const handleAddDrink = (drink: DrinkData) => {
    console.log("Adding drink:", drink.name);
    setDrinks(prev => [...prev, drink]);
    setRefreshTrigger(Date.now()); // Force immediate update with timestamp
    
    // Show toast notification
    toast({
      title: "Drink added",
      description: `${drink.name} (${drink.units.toFixed(1)} units)`,
    });
  };
  
  // Handle removing a drink
  const handleRemoveDrink = (id: string) => {
    console.log("Removing drink with ID:", id);
    setDrinks(prev => prev.filter(drink => drink.id !== id));
    setRefreshTrigger(Date.now()); // Force immediate update with timestamp
  };
  
  // Handle resetting the calculator
  const handleReset = () => {
    console.log("Resetting calculator");
    setDrinks([]);
    setCurrentBac(0);
    setBacData([]);
    setSoberTime(null);
    
    toast({
      title: "Calculator reset",
      description: "All drinks have been cleared",
    });
  };

  // Update BAC calculation when the component is first loaded or on manual refresh
  const refreshCalculations = () => {
    console.log("Manual refresh triggered");
    // Force a fresh calculation by using the current time
    setRefreshTrigger(Date.now());
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
      
      {/* Main content grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="space-y-6">
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
        </div>
        
        {/* BAC Chart */}
        <BacChart 
          data={bacData} 
          soberTime={soberTime}
        />
      </div>
      
      {/* Reset button */}
      <ResetButton onReset={handleReset} />
    </div>
  );
};

export default BacCalculator;
