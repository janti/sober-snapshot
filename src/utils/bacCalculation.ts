export interface UserData {
  gender: 'male' | 'female';
  weight: number;
}

export interface DrinkData {
  id: string;
  name: string;
  volume: number; // in ml
  alcoholPercentage: number;
  units: number;
  timestamp: Date;
}

// Finnish BAC calculation constants
const WIDMARK_CONSTANT = {
  male: 0.68,
  female: 0.55,
};

// Rate at which alcohol is metabolized (percent per hour)
const METABOLISM_RATE = 0.015; // Standard elimination rate of about 0.015% per hour

// Convert ml of pure alcohol to grams (density of alcohol)
const ALCOHOL_DENSITY = 0.789; // g/ml

// Calculate BAC for a single drink
export function calculateBacForDrink(
  user: UserData,
  drink: DrinkData
): number {
  if (user.weight <= 0) return 0;
  
  // Calculate pure alcohol in grams
  const pureAlcoholMl = (drink.volume * drink.alcoholPercentage) / 100;
  const pureAlcoholGrams = pureAlcoholMl * ALCOHOL_DENSITY;
  
  // Widmark formula: BAC = (A / (r * W)) - (0.015 * t)
  // A = pure alcohol in grams
  // r = Widmark constant (0.68 for men, 0.55 for women)
  // W = body weight in kg
  const widmarkConstant = WIDMARK_CONSTANT[user.gender];
  
  // BAC as a decimal percentage (like 0.08% for 0.8‰)
  // Divide by 1000 to convert from g/kg to percentage
  const bac = pureAlcoholGrams / (widmarkConstant * user.weight * 10);
  
  return bac;
}

// Calculate BAC based on all drinks and time elapsed
export function calculateBacOverTime(
  user: UserData,
  drinks: DrinkData[],
  startTime: Date = new Date(), // Default to current time instead of earliest drink
  endTime: Date = new Date(new Date().getTime() + 12 * 60 * 60 * 1000), // Look ahead 12 hours
  intervalMinutes: number = 10
): { time: Date; bac: number }[] {
  if (drinks.length === 0 || user.weight <= 0) return [];

  const sortedDrinks = [...drinks].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Find the earliest drink time if we have drinks
  const earliestDrinkTime = sortedDrinks.length > 0 ? 
    new Date(sortedDrinks[0].timestamp) : 
    new Date();
  
  // Use the current time as the start time ONLY if it's later than the earliest drink time
  // Otherwise, use 30 minutes before the current time to show recent history
  const now = new Date();
  const actualStartTime = new Date(Math.min(
    now.getTime(),
    Math.max(earliestDrinkTime.getTime(), now.getTime() - 30 * 60 * 1000)
  ));
  
  // Generate time points between start and end
  const timePoints: Date[] = [];
  let currentTime = new Date(actualStartTime);
  
  while (currentTime <= endTime) {
    timePoints.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
  }
  
  // Always include the current time as a data point for most accurate current BAC
  if (!timePoints.find(t => Math.abs(t.getTime() - now.getTime()) < 60 * 1000)) {
    timePoints.push(now);
    // Re-sort to maintain chronological order
    timePoints.sort((a, b) => a.getTime() - b.getTime());
  }
  
  // Calculate BAC at each time point
  return timePoints.map(time => {
    // Include all drinks consumed before this time point
    const relevantDrinks = sortedDrinks.filter(drink => drink.timestamp <= time);
    
    // Calculate initial BAC from all relevant drinks
    let totalBac = 0;
    relevantDrinks.forEach(drink => {
      const initialBac = calculateBacForDrink(user, drink);
      
      // Calculate time elapsed since this drink in hours
      const hoursSinceDrink = (time.getTime() - drink.timestamp.getTime()) / (60 * 60 * 1000);
      
      // Subtract metabolism over time
      const remainingBac = Math.max(0, initialBac - (METABOLISM_RATE * hoursSinceDrink));
      totalBac += remainingBac;
    });
    
    return {
      time,
      bac: parseFloat(totalBac.toFixed(4))
    };
  });
}

// Get current BAC value
export function getCurrentBac(
  user: UserData,
  drinks: DrinkData[]
): number {
  if (drinks.length === 0 || user.weight <= 0) return 0;
  
  const now = new Date();
  
  // Calculate BAC at current time only
  let totalBac = 0;
  drinks.forEach(drink => {
    const initialBac = calculateBacForDrink(user, drink);
    
    // Calculate time elapsed since this drink in hours
    const hoursSinceDrink = (now.getTime() - drink.timestamp.getTime()) / (60 * 60 * 1000);
    
    // Subtract metabolism over time
    const remainingBac = Math.max(0, initialBac - (METABOLISM_RATE * hoursSinceDrink));
    totalBac += remainingBac;
  });
  
  return parseFloat(totalBac.toFixed(4));
}

// Calculate time until sober (BAC < 0.01%)
export function calculateTimeTillSober(
  user: UserData,
  drinks: DrinkData[],
  currentTime: Date = new Date()
): Date | null {
  if (drinks.length === 0 || user.weight <= 0) return null;

  // Get current BAC
  const currentBac = getCurrentBac(user, drinks);
  
  // If already sober, return current time
  if (currentBac < 0.001) {
    return currentTime;
  }
  
  // Calculate how many hours needed to metabolize current BAC
  // BAC decreases at rate of METABOLISM_RATE per hour
  const hoursToSober = currentBac / METABOLISM_RATE;
  
  // Calculate sober time
  const soberTime = new Date(currentTime.getTime() + hoursToSober * 60 * 60 * 1000);
  
  return soberTime;
}

// Calculate alcohol units (Finnish standard)
export function calculateAlcoholUnits(volumeMl: number, alcoholPercentage: number): number {
  // Finnish standard: 1 unit = 12g of pure alcohol
  const pureAlcoholMl = (volumeMl * alcoholPercentage) / 100;
  const pureAlcoholGrams = pureAlcoholMl * ALCOHOL_DENSITY;
  const units = pureAlcoholGrams / 12;
  
  return parseFloat(units.toFixed(1));
}

// Finnish alcohol units reference data
export const FINNISH_DRINKS = [
  {
    id: 'beer-regular',
    name: 'Beer (4.7%, 0.33L)',
    volume: 330,
    alcoholPercentage: 4.7,
    units: 1
  },
  {
    id: 'beer-strong',
    name: 'Strong Beer (5.5%, 0.5L)',
    volume: 500,
    alcoholPercentage: 5.5,
    units: 2
  },
  {
    id: 'wine',
    name: 'Wine (12%, 12cl)',
    volume: 120,
    alcoholPercentage: 12,
    units: 1
  },
  {
    id: 'spirit',
    name: 'Spirit (40%, 4cl)',
    volume: 40,
    alcoholPercentage: 40,
    units: 1
  },
  {
    id: 'lonkero',
    name: 'Lonkero (5.5%, 0.33L)',
    volume: 330,
    alcoholPercentage: 5.5,
    units: 1.4
  },
  {
    id: 'cider',
    name: 'Cider (4.7%, 0.33L)',
    volume: 330,
    alcoholPercentage: 4.7,
    units: 1
  },
  {
    id: 'cocktail',
    name: 'Cocktail (15%, 16cl)',
    volume: 160,
    alcoholPercentage: 15,
    units: 1.8
  }
];

// Legal limits in Finland
export const LEGAL_LIMITS = {
  regular: 0.05, // 0.5‰ (conversion from permille to percentage)
  professional: 0.02 // 0.2‰
};
