const fs = require('fs');
const path = 'src/data/foodDatabase.ts';
let text = fs.readFileSync(path, 'utf8');

text = text.replace("export type FoodType = 'Meal' | 'Snack' | 'Salad' | 'Sauce' | 'Dessert';", "export type FoodType = 'Breakfast' | 'MainMeal' | 'Snack' | 'Dessert' | 'Salad';");
text = text.replace(/type: 'Meal'/g, "type: 'MainMeal'");
text = text.replace(/type: 'Sauce'/g, "type: 'Snack'");
text = text.replace(/recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'High'/g, "recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'High'");

fs.writeFileSync(path, text, 'utf8');
console.log('foodDatabase.ts type vocabulary normalized');
