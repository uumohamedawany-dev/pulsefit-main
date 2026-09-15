const fs = require('fs');
const path = 'src/data/foodDatabase.ts';
let text = fs.readFileSync(path, 'utf8');

text = text.replace(
`export interface FoodItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  type: FoodType;
  iconType: FoodIconType;
  recipe: string;
  goal?: FoodGoal;
  budgetLevel?: FoodBudgetLevel;
  tags?: FoodPreferenceTag[];
}`,
`export interface FoodItem {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  type: FoodType;
  iconType: FoodIconType;
  recipe: string;
  recommended_goal: FoodGoal;
  goal?: FoodGoal;
  budgetLevel?: FoodBudgetLevel;
  tags?: FoodPreferenceTag[];
}`
);

text = text.replace(/goal: 'Cutting'/g, "recommended_goal: 'Cutting', goal: 'Cutting'");
text = text.replace(/goal: 'Bulking'/g, "recommended_goal: 'Bulking', goal: 'Bulking'");
text = text.replace(/goal: 'Maintenance'/g, "recommended_goal: 'Maintenance', goal: 'Maintenance'");

fs.writeFileSync(path, text, 'utf8');
console.log('foodDatabase.ts normalized to include recommended_goal on every record');
