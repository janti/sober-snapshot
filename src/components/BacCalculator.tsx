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

  // Force refresh of calculations (use timestamp to avoid reference issues)
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  
  // Set up interval to update current BAC regularly
  useEffect(() => {
    console.log("Setting up BAC update interval");
    const intervalId = setInterval(() => {
      console.log("Interval update triggered");
      setRefreshTimestamp(Date.now());
    }, 30000); // Update every 30 seconds - less frequent to reduce rendering
    
    return () => {
      console.log("Clearing BAC update interval");
      clearInterval(intervalId);
    };
  }, []);
  
  // Update calculations when user data, drinks, or refresh timestamp changes
  useEffect(() => {
    console.log("Updating BAC calculations, drinks:", drinks.length, "refreshTimestamp:", refreshTimestamp);
    
    if (userData.weight <= 0 || drinks.length === 0) {
      setBacData([]);
      setSoberTime(null);
      setCurrentBac(0);
      return;
    }
    
    // Calculate BAC over time for the chart
    const startTime = new Date(Math.min(
      ...drinks.map(d => d.timestamp.getTime()),
      new Date().getTime() // Include current time in the minimum calculation
    ));
      
    // Look ahead 24 hours maximum from now or until sober (whichever is longer)
    const estimatedSoberTime = calculateTimeTillSober(userData, drinks);
    
    // Set end time to at least sober time + 1 hour or 24 hours from now
    const endTime = new Date(Math.max(
      estimatedSoberTime ? estimatedSoberTime.getTime() + 60 * 60 * 1000 : 0, // 1 hour after sober
      new Date().getTime() + 24 * 60 * 60 * 1000 // Max 24 hours from now
    ));
    
    const bacPoints = calculateBacOverTime(userData, drinks, startTime, endTime, 5); // 5-minute intervals
    console.log("Generated BAC points:", bacPoints.length);
    setBacData(bacPoints);
    
    // Get current BAC using dedicated function
    const currentBacValue = getCurrentBac(userData, drinks);
    console.log("Updated current BAC:", currentBacValue);
    setCurrentBac(currentBacValue);
    
    // Update sober time
    console.log("Updated sober time:", estimatedSoberTime);
    setSoberTime(estimatedSoberTime);
    
  }, [userData, drinks, refreshTimestamp]);
  
  // Handle adding a drink
  const handleAddDrink = (drink: DrinkData) => {
    console.log("Adding drink:", drink.name);
    const newDrinks = [...drinks, drink];
    setDrinks(newDrinks);
    
    // Force immediate update with new timestamp
    setRefreshTimestamp(Date.now());
    
    // Show toast notification
    toast({
      title: "Drink added",
      description: `${drink.name} (${drink.units.toFixed(1)} units)`,
    });
  };
  
  // Handle removing a drink
  const handleRemoveDrink = (id: string) => {
    console.log("Removing drink with ID:", id);
    const newDrinks = drinks.filter(drink => drink.id !== id);
    setDrinks(newDrinks);
    
    // Force immediate update with new timestamp
    setRefreshTimestamp(Date.now());
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
    // Force a fresh calculation with new timestamp
    setRefreshTimestamp(Date.now());
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
        
        {/* BAC Chart with timestamp of last data update to force proper refresh */}
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
