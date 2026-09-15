import fs from 'fs';

const path = 'src/data/foodData.ts';
const src = fs.readFileSync(path, 'utf8');
const arrayMatch = src.match(/export const foodData: FoodItem\[\] = \[([\s\S]*?)\];/);
if (!arrayMatch) {
  console.log('No foodData array found');
  process.exit(1);
}

const arrange = JSON.parse('[' + arrayMatch[1] + ']');

const iconFor = (name) => {
  const lower = name.toLowerCase();
  if (/جبنة قريش|جبنة و|جبنة/.test(lower)) return 'cheese';
  if (/حواوشي/.test(lower)) return 'sandwich';
  if (/شيبسي|دوريتوس|تايجر|شيتوس|صن بايتس|بيج/.test(lower)) return 'package';
  if (/قهوة|نسكافيه|تركي/.test(lower)) return 'coffee';
  if (/بسكويت|فريسكا|بيمبو|براونيز/.test(lower)) return 'croissant';
  if (/دجاج|كفتة|صدور|لحم|حواوشي/.test(lower)) return 'drumstick';
  if (/مكرونة|كشري|شوفان|فول|ترمس/.test(lower)) return 'soup';
  if (/تونة|سلطة|خضار|ثومية|كاتشب|رانش/.test(lower)) return 'salad';
  if (/حليب|زبادي|لبن|قريش/.test(lower)) return 'milk';
  if (/منتجات|جبنة|بسكويت/.test(lower)) return 'croissant';
  return 'soup';
};

const recipeFor = (name) => {
  const lower = name.toLowerCase();
  if (/فول/.test(lower)) {
    return 'التحضير: أضف ليمون، كمون، وملعقة صغيرة طحينة أو زيت زيتون. لا تستخدم الزيت العادي. التقديم: قدّمه مع نصف رغيف بلدي أو سلطة الطحينة.';
  }
  if (/كشري/.test(lower)) {
    return 'التحضير: اسكب الكشري فوق الأرز والعدس الساخن، ثم أضف التتبيلة الحارة والبصل المفروم. التقديم: اضف ليمونة وخلطة بصل لتوازن الحدة.';
  }
  if (/حواوشي/.test(lower)) {
    return 'المقادير: لحم مفروم قليل الدسم، بصل، فلفل أخضر، بهارات حواوشي، عيش أسمر أو شوفان. الطريقة: اخلط المكونات، احشِ الخبز، وقم بتسويته في الفرن أو المقلاة الهوائية (Air Fryer) بمسحة زيت زيتون بسيطة.';
  }
  if (/جبنة قريش/.test(lower)) {
    return 'لتحويلها لجبنة كريمي: اضربها في الخلاط مع قليل من الحليب خالي الدسم، رشة زعتر، وزيت زيتون. يمكن إضافة فلفل ألوان أو زيتون.';
  }
  if (/جبنة مثلثات|بريزيدون/.test(lower)) {
    return 'التحضير: خذ القطعة مع قليل من الزيتون أو خضار طازج. التقديم: أضفها إلى ساندويتش أو طبق خضار مع فلفل أسود.';
  }
  if (/دجاج|كفتة|صدور|لحم/.test(lower)) {
    return 'التحضير: قم بتتبيل اللحم بالثوم، الفلفل الأسود، والزعتر، ثم اشوي أو اطبخ في الفرن حتى ينضج. التقديم: قدّم مع خضار مشوي أو أرز خفيف.';
  }
  if (/شيبسي|دوريتوس|تايجر|شيتوس|صن بايتس|بيج/.test(lower)) {
    return 'التحضير: اختَر Portion صغيرًا، ثم رتبها مع عصير طبيعي. التقديم: خذها كوجبة خفيفة في منتصف اليوم مع خيار طازج.';
  }
  if (/قهوة|نسكافيه|تركي/.test(lower)) {
    return 'التحضير: استخلص القهوة مع قليل من الماء أو الحليب خالي الدسم، ثم أضف رشة قرفة أو عسل دايت عند الحاجة. التقديم: اشربها بعيدًا عن الوجبة مباشرة.';
  }
  if (/حليب|زبادي|لبن/.test(lower)) {
    return 'التحضير: أضف قليل من الفاكهة أو العسل الدايت، ثم اخلط جيداً. التقديم: خذها كوجبة خفيفة بعد التمرين أو في السحور.';
  }
  if (/تونة/.test(lower)) {
    return 'التحضير: أضف زيت زيتون، ليمون، وفلفل أسود. التقديم: قدّمها مع سلطة خيار، طماطم، أو خبز أسمر.';
  }
  if (/بسكويت|فريسكا|بيمبو|براونيز/.test(lower)) {
    return 'التحضير: استخدم قطعة واحدة فقط، وقدمها مع شاي خالي من السكر أو قهوة خفيفة. التقديم: اجعلها جزءًا من وجبة صغيرة مع بروتين.';
  }
  if (/مكرونة/.test(lower)) {
    return 'التحضير: اطبخ المكرونة مع صلصة طماطم دايت أو شوفان خفيف. التقديم: أضف خضار مشوي مع رشة جبن قليل الدسم.';
  }
  if (/شوفان/.test(lower)) {
    return 'التحضير: انقع الشوفان مع حليب خالي الدسم أو ماء، ثم أضف موزاً أو تمر هندي قليل. التقديم: خدمه ساخن مع عسل دايت إن رغبت.';
  }
  if (/ترمس/.test(lower)) {
    return 'التحضير: اغلي الترمس مع ملح خفيف ثم أضف عصير ليمون وملعقة زيت زيتون. التقديم: قدّمه مع سلطة خس وطحينة خفيفة.';
  }
  return 'التحضير: أضف خضار طازج أو رشة أعشاب مع قليل من زيت الزيتون. التقديم: قدّم الطبق ساخنًا مع بروتين معتدل.';
};

for (const item of arrange) {
  item.iconType = iconFor(item.name);
  item.recipe = recipeFor(item.name);
  delete item.imageUrl;
}

const recipeItems = [
  {
    name: 'تشيز كيك دايت',
    calories: 180,
    protein_g: 12,
    carbs_g: 10,
    fats_g: 8,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'cake',
    recipe: 'القاعدة: بسكويت شوفان مطحون مع زبدة فول سوداني. الطبقة: جبنة قريش مضروبة في الخلاط حتى تصبح كريمية مع زبادي يوناني وسكر دايت (ستيفيا)، وتبرد في الثلاجة.'
  },
  {
    name: 'كولسلو دايت',
    calories: 90,
    protein_g: 4,
    carbs_g: 8,
    fats_g: 3,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'salad',
    recipe: 'الصوص: زبادي يوناني بدلاً من المايونيز، ملعقة صغيرة عسل أبيض، خل تفاح، ملح وفلفل. يضاف للكرنب والجزر المبشور.'
  },
  {
    name: 'كاتشب صحي',
    calories: 45,
    protein_g: 1,
    carbs_g: 7,
    fats_g: 0,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'droplet',
    recipe: 'صلصة طماطم طبيعية مطبوخة مع خل تفاح، سكر دايت، ثوم وبصل بودرة، ورشة قرنفل.'
  },
  {
    name: 'ثومية دايت',
    calories: 90,
    protein_g: 4,
    carbs_g: 8,
    fats_g: 4,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'droplet',
    recipe: 'نشا مطبوخ في ماء حتى يتماسك، يضرب في الخلاط مع ثوم مفروم، زبادي يوناني، عصرة ليمون، وملعقة صغيرة زيت زيتون.'
  },
  {
    name: 'صوص الرانش الدايت',
    calories: 70,
    protein_g: 5,
    carbs_g: 4,
    fats_g: 3,
    type: 'Recipe',
    recommended_goal: 'Maintenance',
    iconType: 'droplet',
    recipe: 'زبادي يوناني، ثوم بودرة، بصل بودرة، شبت وبقدونس مجفف، حليب خالي الدسم للوصول للقوام المطلوب.'
  }
];

for (const item of recipeItems) {
  arrange.push(item);
}

const newInterface = `export type FoodType = 'Meal' | 'Snack' | 'Recipe';\nexport type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';\nexport type FoodIconType = 'cheese' | 'beef' | 'sandwich' | 'croissant' | 'soup' | 'drumstick' | 'cake' | 'salad' | 'droplet' | 'package' | 'coffee' | 'cookie' | 'milk' | 'bowl';\n\nexport interface FoodItem {\n  name: string;\n  calories: number;\n  protein_g: number;\n  carbs_g: number;\n  fats_g: number;\n  type: FoodType;\n  recommended_goal: FoodGoal;\n  iconType: FoodIconType;\n  recipe: string;\n}\n\n`;

const out = `${newInterface}export const foodData: FoodItem[] = ${JSON.stringify(arrange, null, 2)};\n`;
fs.writeFileSync(path, out);
console.log('updated foodData.ts with iconType, recipe and recipe-type items');
