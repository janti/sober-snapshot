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
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Set up interval to update current BAC regularly
  useEffect(() => {
    const intervalId = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Update calculations when user data, drinks, or refresh counter changes
  useEffect(() => {
    console.log("Updating BAC calculations, drinks:", drinks.length);
    
    if (userData.weight <= 0 || drinks.length === 0) {
      setBacData([]);
      setSoberTime(null);
      setCurrentBac(0);
      return;
    }
    
    // Calculate estimated sober time
    const estimatedSoberTime = calculateTimeTillSober(userData, drinks);
    
    // Determine start and end times for calculation
    const startTime = new Date(Math.min(
      ...drinks.map(d => d.timestamp.getTime()),
      new Date().getTime()
    ));
    
    // Set end time to at least sober time + 2 hours or 24 hours from now
    const endTime = new Date(Math.max(
      estimatedSoberTime ? estimatedSoberTime.getTime() + 2 * 60 * 60 * 1000 : 0,
      new Date().getTime() + 24 * 60 * 60 * 1000
    ));
    
    // Calculate BAC points at 10-minute intervals
    const bacPoints = calculateBacOverTime(userData, drinks, startTime, endTime, 10);
    
    // Ensure we always have at least 10 data points for a good visualization
    if (bacPoints.length < 10) {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const interval = totalDuration / 9; // 9 intervals to get 10 points
      
      const enhancedPoints: { time: Date; bac: number }[] = [];
      for (let i = 0; i < 10; i++) {
        const pointTime = new Date(startTime.getTime() + i * interval);
        
        // Find the closest actual point or interpolate
        const closestPoint = bacPoints.reduce((prev, curr) => {
          return Math.abs(curr.time.getTime() - pointTime.getTime()) < 
                 Math.abs(prev.time.getTime() - pointTime.getTime()) ? curr : prev;
        }, bacPoints[0]);
        
        enhancedPoints.push({
          time: pointTime,
          bac: closestPoint.bac
        });
      }
      
      setBacData(enhancedPoints);
    } else {
      setBacData(bacPoints);
    }
    
    // Get current BAC
    const currentBacValue = getCurrentBac(userData, drinks);
    setCurrentBac(currentBacValue);
    
    // Update sober time
    setSoberTime(estimatedSoberTime);
    
  }, [userData, drinks, refreshCounter]);
  
  // Handle adding a drink
  const handleAddDrink = (drink: DrinkData) => {
    console.log("Adding drink:", drink.name);
    const newDrinks = [...drinks, drink];
    setDrinks(newDrinks);
    
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
    const newDrinks = drinks.filter(drink => drink.id !== id);
    setDrinks(newDrinks);
    
    // Force immediate update with new timestamp
    setRefreshCounter(Date.now());
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
    setRefreshCounter(prev => prev + 1);
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
