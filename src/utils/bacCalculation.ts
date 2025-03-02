
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
  startTime: Date = new Date(Math.min(...drinks.map(d => d.timestamp.getTime()))),
  endTime: Date = new Date(new Date().getTime() + 12 * 60 * 60 * 1000),
  intervalMinutes: number = 10
): { time: Date; bac: number }[] {
  if (drinks.length === 0 || user.weight <= 0) return [];

  const sortedDrinks = [...drinks].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  // Ensure startTime is not after the current time
  const now = new Date();
  if (startTime > now) {
    startTime = now;
  }
  
  // Generate time points between start and end
  const timePoints: Date[] = [];
  let currentTime = new Date(startTime);
  
  while (currentTime <= endTime) {
    timePoints.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60 * 1000);
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

// Calculate time until sober (BAC < 0.01%)
export function calculateTimeTillSober(
  user: UserData,
  drinks: DrinkData[],
  currentTime: Date = new Date()
): Date | null {
  if (drinks.length === 0 || user.weight <= 0) return null;

  const bacPoints = calculateBacOverTime(
    user,
    drinks,
    new Date(Math.min(...drinks.map(d => d.timestamp.getTime()))),
    new Date(currentTime.getTime() + 24 * 60 * 60 * 1000), // Look ahead 24 hours max
    30 // 30-minute intervals
  );
  
  const soberPoint = bacPoints.find(point => point.bac < 0.001);
  return soberPoint ? soberPoint.time : null;
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
