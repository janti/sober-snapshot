
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserData } from '@/utils/bacCalculation';

interface UserFormProps {
  userData: UserData;
  onChange: (userData: UserData) => void;
  className?: string;
}

const UserForm: React.FC<UserFormProps> = ({ userData, onChange, className }) => {
  const handleGenderChange = (value: string) => {
    onChange({
      ...userData,
      gender: value as 'male' | 'female'
    });
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weightValue = e.target.value;
    const weight = parseInt(weightValue);
    if (!isNaN(weight) && weight > 0) {
      onChange({
        ...userData,
        weight
      });
    } else if (weightValue === '') {
      // Allow empty input for better UX
      onChange({
        ...userData,
        weight: 0
      });
    }
  };

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-medium">Personal Information</CardTitle>
        <CardDescription>These details help calculate your BAC accurately</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <RadioGroup 
            value={userData.gender} 
            onValueChange={handleGenderChange}
            className="flex gap-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="font-normal">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="font-normal">Female</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (kg)</Label>
          <Input
            id="weight"
            type="number"
            min="30"
            max="200"
            value={userData.weight || ''}
            onChange={handleWeightChange}
            className="w-full"
            placeholder="Enter your weight"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserForm;
