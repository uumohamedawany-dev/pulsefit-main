const fs = require('fs');
const path = 'src/data/foodData.ts';
const src = fs.readFileSync(path, 'utf8');
const start = src.indexOf('export const foodData');
const arrText = src.slice(src.indexOf('[', start), src.lastIndexOf(']') + 1);
const arr = JSON.parse(arrText);

const pasta = 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=900&q=80';
const chips = 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=900&q=80';
const chocolate = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80';
const meat = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80';
const coffee = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80';
const dairy = 'https://images.unsplash.com/photo-1498654896290-37a665832b1d?auto=format&fit=crop&w=900&q=80';
const bowl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

const imageFor = (item) => {
  const n = item.name;
  if (/كشري|مكرونة|شوفان|فول|ترمس/.test(n)) return pasta;
  if (/شيبسي|دوريتوس|بيج|تايجر|شيتوس|صن بايتس/.test(n)) return chips;
  if (/شوكولاتة|مورو|جلاكسي|كادبوري|مولتو|تودو/.test(n)) return chocolate;
  if (/دجاج|كفتة|صدور|لحم|حواوشي/.test(n)) return meat;
  if (/قهوة|نسكافيه|تركي/.test(n)) return coffee;
  if (/حليب|زبادي|لبن|جبنة|قريش|بريزيدون/.test(n)) return dairy;
  if (/تونة|بيض/.test(n)) return bowl;
  return bowl;
};

arr.forEach(item => {
  item.imageUrl = imageFor(item);
});

const newInterface = "export type FoodType = 'Meal' | 'Snack';\nexport type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';\n\nexport interface FoodItem {\n  name: string;\n  calories: number;\n  protein_g: number;\n  carbs_g: number;\n  fats_g: number;\n  type: FoodType;\n  recommended_goal: FoodGoal;\n  imageUrl: string;\n}\n\n";
const out = newInterface + "export const foodData: FoodItem[] = " + JSON.stringify(arr, null, 2) + ';\n';
fs.writeFileSync(path, out);
console.log('updated foodData.ts with imageUrl');
