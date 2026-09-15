import fs from 'fs';

const foodData = [
  {
    name: 'كفتة مشوية دايت (100 جرام)',
    calories: 220,
    protein_g: 15.0,
    carbs_g: 4.0,
    fats_g: 16.0,
    type: 'Meal',
    recommended_goal: 'Cutting',
    iconType: 'Beef',
    recipe: 'المقادير: لحم مفروم قليل الدسم (أحمر)، تفل بصل معصور من الماء، بقدونس، ملح، فلفل أسود وبهارات كفتة. الطريقة: تعجن المكونات جيداً وتشكل على أسياخ، ثم تشوى على الجريل أو في الفرن بدون إضافة أي زيوت.'
  },
  {
    name: 'صدور دجاج بانيه صحية (100 جرام)',
    calories: 180,
    protein_g: 22.0,
    carbs_g: 8.0,
    fats_g: 6.0,
    type: 'Meal',
    recommended_goal: 'Bulking',
    iconType: 'Drumstick',
    recipe: 'المقادير: صدور دجاج مخلية، ماء بصل، ليمون، بيضة، بقسماط مخلوط بشوفان مطحون. الطريقة: تتبل الصدور، تُغمس في البيض المضروب بقليل من الحليب خالي الدسم، ثم في خليط الشوفان. تُسوى في القلاية الهوائية (Air Fryer) أو الفرن مع رشة زيت خفيفة جداً.'
  },
  {
    name: 'الجبنة القريش الكريمي (100 جرام)',
    calories: 98,
    protein_g: 11.0,
    carbs_g: 3.0,
    fats_g: 4.0,
    type: 'Meal',
    recommended_goal: 'Cutting',
    iconType: 'Cheese',
    recipe: 'لتحويلها لجبنة كريمي ناعمة: توضع الجبنة القريش في الخلاط مع ملعقتين حليب خالي الدسم، ملعقة صغيرة زيت زيتون، ورشة زعتر. تضرب جيداً حتى يصبح قوامها مثل الجبنة الكوبايات. يمكن إضافة قطع فلفل ألوان أو زيتون.'
  },
  {
    name: 'حواوشي صحي بالعيش الأسمر (100 جرام)',
    calories: 250,
    protein_g: 12.0,
    carbs_g: 25.0,
    fats_g: 11.0,
    type: 'Meal',
    recommended_goal: 'Bulking',
    iconType: 'Beef',
    recipe: 'المقادير: لحم مفروم قليل الدسم، بصل وفلفل أخضر مفرومين، بهارات حواوشي، عيش بلدي أسمر أو عيش شوفان. الطريقة: تخلط المكونات وتحشى في الخبز، يُدهن الخبز بمسحة زيت زيتون خفيفة جداً ويُسوى في الفرن أو المقلاة الهوائية.'
  },
  {
    name: 'فول مدمس صحي (100 جرام)',
    calories: 110,
    protein_g: 8.0,
    carbs_g: 20.0,
    fats_g: 1.0,
    type: 'Meal',
    recommended_goal: 'Cutting',
    iconType: 'Utensils',
    recipe: 'الطريقة الصحيحة للدايت: أضف عصير ليمون، كمون، وملعقة صغيرة من زيت الزيتون أو الطحينة الخام. ابتعد تماماً عن الزيت الحار أو الزيت العادي لتقليل السعرات.'
  },
  {
    name: 'تشيز كيك دايت',
    calories: 150,
    protein_g: 12.0,
    carbs_g: 15.0,
    fats_g: 5.0,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'Cake',
    recipe: 'القاعدة: بسكويت شوفان سادة مطحون ومخلوط بملعقة زبدة فول سوداني. الطبقة العلوية: جبنة قريش مضروبة في الخلاط حتى تنعم تماماً مع زبادي يوناني، فانيليا، وسكر ستيفيا. توضع فوق القاعدة وتبرد في الثلاجة 4 ساعات.'
  },
  {
    name: 'صوص الرانش الدايت',
    calories: 35,
    protein_g: 3.0,
    carbs_g: 2.0,
    fats_g: 1.0,
    type: 'Recipe',
    recommended_goal: 'Cutting',
    iconType: 'Droplet',
    recipe: 'البديل الصحي للمايونيز: علبة زبادي يوناني، نصف ملعقة ثوم بودرة، بصل بودرة، شبت مجفف، وبقدونس مجفف. يقلب جيداً ويمكن تخفيفه بملعقة حليب خالي الدسم للوصول لقوام الرانش الأصلي.'
  }
];

const newInterface = `export type FoodType = 'Meal' | 'Snack' | 'Recipe';\nexport type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';\nexport type FoodIconType = 'Beef' | 'Drumstick' | 'Cheese' | 'Utensils' | 'Cake' | 'Droplet';\n\nexport interface FoodItem {\n  name: string;\n  calories: number;\n  protein_g: number;\n  carbs_g: number;\n  fats_g: number;\n  type: FoodType;\n  recommended_goal: FoodGoal;\n  iconType: FoodIconType;\n  recipe: string;\n}\n\n`;

const out = `${newInterface}export const foodData: FoodItem[] = ${JSON.stringify(foodData, null, 2)};\n`;
fs.writeFileSync('src/data/foodData.ts', out);
console.log('updated strict foodData.ts');
