import fs from 'fs';

const path = 'src/data/foodData.ts';
const src = fs.readFileSync(path, 'utf8');
const arrayMatch = src.match(/export const foodData: FoodItem\[\] = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.log('No foodData array found');
  process.exit(1);
}

const arr = JSON.parse(`[${arrayMatch[1]}]`);

const iconFor = (name) => {
  const lower = name.toLowerCase();
  if (/جبنة|قريش|مثلثات|بريزيدون/.test(lower)) return 'cheese';
  if (/شيبسي|دوريتوس|تايجر|شيتوس|صن بايتس|بيج/.test(lower)) return 'package';
  if (/قهوة|نسكافيه|تركي/.test(lower)) return 'coffee';
  if (/دجاج|لحم|كفتة|حواوشي|صدور/.test(lower)) return 'drumstick';
  if (/بسكويت|براونيز|فريسكا|بيمبو/.test(lower)) return 'cookie';
  if (/شوفان|مكرونة|فول|ترمس|كشري/.test(lower)) return 'soup';
  if (/تونة|جبنة/.test(lower)) return 'salad';
  if (/حليب|زبادي|لبن/.test(lower)) return 'milk';
  return 'soup';
};

const recipeFor = (name) => {
  const lower = name.toLowerCase();
  if (/فول/.test(lower)) return '1. أضف ملعقة زيت زيتون وكمون. 2. قدّمه مع نصف رغيف بلدي.';
  if (/كشري/.test(lower)) return '1. أضف الصلصة والعدس الساخن. 2. قدّمه مع ليمونة وخلطة بصل.';
  if (/شيبسي|دوريتوس|تايجر|شيتوس|صن بايتس|بيج/.test(lower)) return '1. خذ Portionًا صغيرًا مع عصير طبيعي. 2. رتبها كوجبة خفيفة بعد الظهر.';
  if (/شوكولاتة|مولتو|تودو|بسكويت|براونيز/.test(lower)) return '1. اختر قطعة صغيرة مع فاكهة. 2. خذها بعد الوجبة بدل الحلويات الثقيلة.';
  if (/قهوة|نسكافيه|تركي/.test(lower)) return '1. أضف القرفة أو الحليب حسب الرغبة. 2. اشربها بعيدًا عن الوجبة مباشرة.';
  if (/حليب|زبادي|لبن/.test(lower)) return '1. أضف فاكهة أو عسل خفيف. 2. خذه كوجبة خفيفة أو مع السحلية.';
  if (/تونة|جبنة/.test(lower)) return '1. أضف زيت زيتون وليمون. 2. قدّمها مع خبز كامل أو سلطة.';
  if (/دجاج|كفتة|حواوشي|صدور|لحم/.test(lower)) return '1. أضف خضار مشوي وملعقة سلطة. 2. قدّمه ساخن مع كربوهيدرات معتدل.';
  if (/مكرونة|شوفان/.test(lower)) return '1. أضف خضار أو حليب خفيف. 2. قدمه ساخن مع نتن أو بصل.';
  if (/ترمس/.test(lower)) return '1. أضف عصير ليمون وملعقة زيت. 2. قدّمه مع خبز أو سلطة.';
  return '1. أضف رشة من الأعشاب الطازجة. 2. قدّمه ساخن مع خضار أو خبز.';
};

for (const item of arr) {
  item.iconType = iconFor(item.name);
  item.recipe = recipeFor(item.name);
  delete item.imageUrl;
}

const newInterface = `export type FoodType = 'Meal' | 'Snack';\nexport type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';\nexport type FoodIconType = 'cheese' | 'package' | 'coffee' | 'drumstick' | 'cookie' | 'soup' | 'salad' | 'milk' | 'bowl';\n\nexport interface FoodItem {\n  name: string;\n  calories: number;\n  protein_g: number;\n  carbs_g: number;\n  fats_g: number;\n  type: FoodType;\n  recommended_goal: FoodGoal;\n  iconType: FoodIconType;\n  recipe: string;\n}\n\n`;

const out = newInterface + `export const foodData: FoodItem[] = ${JSON.stringify(arr, null, 2)};\n`;
fs.writeFileSync(path, out);
console.log('updated foodData.ts with iconType and recipe');
