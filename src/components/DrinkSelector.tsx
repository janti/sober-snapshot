
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DrinkData, FINNISH_DRINKS, calculateAlcoholUnits } from '@/utils/bacCalculation';
import { PlusCircle, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DrinkSelectorProps {
  drinks: DrinkData[];
  onAddDrink: (drink: DrinkData) => void;
  onRemoveDrink: (id: string) => void;
  onClearDrinks: () => void;
  className?: string;
}

const DrinkSelector: React.FC<DrinkSelectorProps> = ({ 
  drinks, 
  onAddDrink, 
  onRemoveDrink, 
  onClearDrinks,
  className 
}) => {
  const [selectedDrinkId, setSelectedDrinkId] = useState<string>(FINNISH_DRINKS[0].id);
  const [showCustomForm, setShowCustomForm] = useState(false);
  
  const [customName, setCustomName] = useState('Custom Drink');
  const [customVolume, setCustomVolume] = useState('100');
  const [customAlcoholPercentage, setCustomAlcoholPercentage] = useState('5.0');

  const handleAddDrink = () => {
    const selectedDrinkTemplate = FINNISH_DRINKS.find(drink => drink.id === selectedDrinkId);
    if (!selectedDrinkTemplate) return;
    
    const newDrink: DrinkData = {
      ...selectedDrinkTemplate,
      id: `${selectedDrinkTemplate.id}-${Date.now()}`,
      timestamp: new Date()
    };
    
    onAddDrink(newDrink);
  };

  const handleAddCustomDrink = () => {
    const volume = parseFloat(customVolume);
    const alcoholPercentage = parseFloat(customAlcoholPercentage);
    
    if (isNaN(volume) || isNaN(alcoholPercentage) || volume <= 0 || alcoholPercentage <= 0) {
      return;
    }
    
    const units = calculateAlcoholUnits(volume, alcoholPercentage);
    
    const newDrink: DrinkData = {
      id: `custom-${Date.now()}`,
      name: customName || 'Custom Drink',
      volume,
      alcoholPercentage,
      units,
      timestamp: new Date()
    };
    
    onAddDrink(newDrink);
    
    setShowCustomForm(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const totalUnits = drinks.reduce((sum, drink) => sum + drink.units, 0);

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-medium">Add Drinks</CardTitle>
        <CardDescription>Track your alcohol consumption</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!showCustomForm ? (
          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select value={selectedDrinkId} onValueChange={setSelectedDrinkId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a drink" />
                  </SelectTrigger>
                  <SelectContent>
                    {FINNISH_DRINKS.map(drink => (
                      <SelectItem key={drink.id} value={drink.id}>
                        {drink.name} ({drink.units} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddDrink} className="flex items-center gap-1">
                <PlusCircle className="w-4 h-4" />
                <span>Add</span>
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCustomForm(true)}
              className="w-full flex items-center justify-center gap-1"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Create Custom Drink</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customName">Drink Name</Label>
                <Input 
                  id="customName"
                  value={customName} 
                  onChange={(e) => setCustomName(e.target.value)} 
                  placeholder="Custom Drink"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customVolume">Volume (ml)</Label>
                <Input 
                  id="customVolume"
                  type="number" 
                  min="0"
                  value={customVolume} 
                  onChange={(e) => setCustomVolume(e.target.value)} 
                  placeholder="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customAlcohol">Alcohol Content (%)</Label>
                <Input 
                  id="customAlcohol"
                  type="number" 
                  min="0"
                  max="100"
                  step="0.1"
                  value={customAlcoholPercentage} 
                  onChange={(e) => setCustomAlcoholPercentage(e.target.value)} 
                  placeholder="5.0"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCustomForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCustomDrink}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Custom Drink</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {drinks.length > 0 && (
          <>
            <div className="mt-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-medium">Your drinks</div>
                <Badge variant="outline" className="font-semibold">
                  Total: {totalUnits.toFixed(1)} units
                </Badge>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drinks.map((drink, index) => (
                  <div 
                    key={drink.id} 
                    className="flex items-center justify-between p-3 bg-secondary rounded-md animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div>
                      <div className="font-medium text-sm">{drink.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(drink.timestamp)} • {drink.units} units • 
                        {drink.volume}ml ({drink.alcoholPercentage}%)
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveDrink(drink.id)}
                      className="h-8 w-8 text-destructive opacity-70 hover:opacity-100 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearDrinks}
                className="text-destructive hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DrinkSelector;
