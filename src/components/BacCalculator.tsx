
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserData, 
  DrinkData, 
  LEGAL_LIMITS,
  calculateBacOverTime,
  calculateTimeTillSober,
  getCurrentBac
} from '@/utils/bacCalculation';
import UserForm from './UserForm';
import DrinkSelector from './DrinkSelector';
import BacChart from './BacChart';
import { RefreshCw, AlertTriangle, BadgeCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
    }, 5000); // Update every 5 seconds for more responsive updates
    
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
      new Date().getTime(),
      startTime.getTime() + 12 * 60 * 60 * 1000
    ));
    
    const bacPoints = calculateBacOverTime(userData, drinks, startTime, endTime, 10);
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

  // Get BAC status message and color
  const getBacStatus = () => {
    if (currentBac === 0) return { message: "Sober", icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.professional) return { message: "Below Professional Limit", icon: <BadgeCheck className="h-5 w-5" />, color: "text-green-500" };
    if (currentBac <= LEGAL_LIMITS.regular) return { message: "Below Regular Limit", icon: <AlertTriangle className="h-5 w-5" />, color: "text-amber-500" };
    return { message: "Above Legal Limit", icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-500" };
  };

  const status = getBacStatus();

  // Update BAC calculation when the component is first loaded or on manual refresh
  const refreshCalculations = () => {
    console.log("Manual refresh triggered");
    // Force a fresh calculation by using the current time
    setRefreshTrigger(Date.now());
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Main header */}
      <div className="text-center mb-8 animate-slide-down">
        <h1 className="text-4xl font-bold mb-2">Finnish BAC Calculator</h1>
        <p className="text-lg text-muted-foreground">
          Track your blood alcohol concentration based on Finnish standards
        </p>
      </div>
      
      {/* Current BAC display */}
      <Card className="mb-8 mx-auto max-w-md animate-fade-in">
        <CardContent className="py-6 flex flex-col items-center">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Current BAC
          </div>
          <div className="text-6xl font-bold mb-2 mt-2">
            {(currentBac * 10).toFixed(1)}‰
          </div>
          <div className={`flex items-center ${status.color} font-medium gap-1.5`}>
            {status.icon}
            <span>{status.message}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshCalculations} 
            className="mt-3 text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </Button>
        </CardContent>
      </Card>
      
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
      <div className="flex justify-center mb-12">
        <Button 
          onClick={handleReset} 
          variant="outline" 
          size="lg"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Reset Calculator</span>
        </Button>
      </div>
    </div>
  );
};

export default BacCalculator;
