export type FoodType = 'Breakfast' | 'MainMeal' | 'Snack' | 'Dessert' | 'Salad';
export type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';
export type FoodBudgetLevel = 'Low' | 'Medium' | 'High';
export type FoodPreferenceTag = 'Vegetarian' | 'High Protein' | 'Quick Prep' | 'No Fish' | 'No Meat' | 'No Dairy';

export type FoodIconType =
  | 'Beef'
  | 'Drumstick'
  | 'Fish'
  | 'Utensils'
  | 'Cheese'
  | 'Cookie'
  | 'Package'
  | 'Carrot'
  | 'Coffee'
  | 'Droplet'
  | 'Cake';

export interface FoodItem {
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
  budgetLevel: FoodBudgetLevel;
  tags?: FoodPreferenceTag[];
}

export const foodDatabase: FoodItem[] = [
  { name: 'Egyptian Rice (Cooked)', calories: 205, protein_g: 4.0, carbs_g: 45.0, fats_g: 1.5, type: 'MainMeal', iconType: 'Utensils', recipe: 'Classic cooked Egyptian rice. A staple carb base used for a balanced lunch or post-workout plate.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'Grilled Chicken Breast', calories: 165, protein_g: 31.0, carbs_g: 0.0, fats_g: 3.6, type: 'MainMeal', iconType: 'Drumstick', recipe: 'Lean grilled chicken breast with lemon, garlic, and a dry Egyptian spice mix.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein'] },
  { name: 'Lean Minced Beef', calories: 210, protein_g: 23.0, carbs_g: 0.0, fats_g: 12.0, type: 'MainMeal', iconType: 'Beef', recipe: 'Lean beef mince cooked dry with onion, tomato, and Egyptian spices for a high-protein protein base.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein'] },
  { name: 'Egyptian Baladi Bread (per loaf)', calories: 190, protein_g: 8.0, carbs_g: 39.0, fats_g: 1.5, type: 'MainMeal', iconType: 'Utensils', recipe: 'One fresh Egyptian Baladi loaf. Best paired with foul, meat, or cheese bowls.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'Olive Oil (per tablespoon)', calories: 119, protein_g: 0.0, carbs_g: 0.0, fats_g: 14.0, type: 'Snack', iconType: 'Droplet', recipe: 'One tablespoon of olive oil for cooking, salad dressing, or topping a dish.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Medium', tags: ['Quick Prep'] },
  { name: 'Bananas and Dates (Balah)', calories: 120, protein_g: 2.0, carbs_g: 26.0, fats_g: 1.0, type: 'Breakfast', iconType: 'Cake', recipe: 'Egyptian bananas and dates give a clean carb source with fruit and natural sweetness.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Vegetarian'] },

  { name: 'Foul Medames Bowl', calories: 290, protein_g: 14.0, carbs_g: 45.0, fats_g: 8.5, type: 'Breakfast', iconType: 'Utensils', recipe: 'Foul medames with olive oil, cumin, lemon, and half a Baladi bread loaf for a classic Egyptian gym breakfast.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Vegetarian', 'High Protein'] },
  { name: 'Qurish Cheese Salad', calories: 240, protein_g: 24.0, carbs_g: 8.0, fats_g: 13.0, type: 'Breakfast', iconType: 'Cheese', recipe: 'Qurish cheese mixed with tomato, cucumber, herbs, and a drizzle of olive oil.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['High Protein'] },
  { name: 'Fit Egyptian Shakshouka', calories: 300, protein_g: 21.5, carbs_g: 18.0, fats_g: 16.0, type: 'Breakfast', iconType: 'Utensils', recipe: '3 whole eggs cooked in tomato, onion, and bell pepper sauce with Egyptian spices.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'Oatmeal with Dates', calories: 490, protein_g: 19.0, carbs_g: 80.0, fats_g: 9.0, type: 'Breakfast', iconType: 'Cookie', recipe: 'Rolled oats cooked in milk and topped with chopped Egyptian dates and cinnamon.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'Boiled Eggs & Sweet Potato (Batata)', calories: 440, protein_g: 22.0, carbs_g: 55.0, fats_g: 16.0, type: 'Breakfast', iconType: 'Drumstick', recipe: '3 boiled eggs paired with a baked sweet potato for a simple Egyptian bodybuilding breakfast.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'Low', tags: ['High Protein'] },
  { name: 'Baked Taameya (Falafel)', calories: 260, protein_g: 16.0, carbs_g: 30.0, fats_g: 8.0, type: 'Breakfast', iconType: 'Utensils', recipe: 'Low-fat baked taameya made from fava beans, herbs, and onion for a healthier Egyptian falafel bowl.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian', 'High Protein'] },

  { name: 'كفتة لحم مشوية', calories: 220, protein_g: 15.0, carbs_g: 4.0, fats_g: 16.0, type: 'MainMeal', iconType: 'Beef', recipe: 'المقادير: لحم مفروم قليل الدسم، تفل بصل، بقدونس، بهارات كفتة. الطريقة: تشكل وتشوى على الجريل بدون زيت.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'High', tags: ['High Protein'] },
  { name: 'صدور دجاج بانيه صحية', calories: 180, protein_g: 22.0, carbs_g: 8.0, fats_g: 6.0, type: 'MainMeal', iconType: 'Drumstick', recipe: 'تتبل بماء البصل والليمون، تغمس في بيض وشوفان مطحون، تسوى في الـ Air Fryer.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein', 'Quick Prep'] },
  { name: 'سمك بلطي مشوي رده', calories: 130, protein_g: 26.0, carbs_g: 0.0, fats_g: 3.0, type: 'MainMeal', iconType: 'Fish', recipe: 'يتبل بالثوم، الكمون، الليمون، يغلف بالرده ويشوى في الفرن.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'High', tags: ['High Protein'] },
  { name: 'طاجن بامية باللحم الدايت', calories: 180, protein_g: 18.0, carbs_g: 12.0, fats_g: 8.0, type: 'MainMeal', iconType: 'Utensils', recipe: 'بصلة تشوح في مسحة زيت، يضاف عصير الطماطم واللحم المسلوق مسبقاً، ثم البامية وتسوى في الفرن.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Medium', tags: ['Quick Prep'] },
  { name: 'كشري مصري دايت', calories: 250, protein_g: 10.0, carbs_g: 45.0, fats_g: 3.0, type: 'MainMeal', iconType: 'Utensils', recipe: 'استخدم مكرونة حبة كاملة وأرز بني، سلق العدس، والصلصة بدون تسبيك بزيت، البصل يحمر في الإير فراير.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'حواوشي صحي (عيش أسمر)', calories: 250, protein_g: 12.0, carbs_g: 25.0, fats_g: 11.0, type: 'MainMeal', iconType: 'Beef', recipe: 'لحم قليل الدسم يخلط مع بصل وفلفل وبهارات، يحشى في عيش بلدي ويسوى في الفرن.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'Medium', tags: ['High Protein'] },
  { name: 'فاهيتا دجاج', calories: 210, protein_g: 25.0, carbs_g: 10.0, fats_g: 7.0, type: 'MainMeal', iconType: 'Drumstick', recipe: 'شرائح دجاج تشوح مع فلفل ألوان وبصل وملعقة زيت زيتون وبهارات فاهيتا.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein', 'Quick Prep'] },
  { name: 'فول مدمس بالكمون والليمون', calories: 110, protein_g: 8.0, carbs_g: 20.0, fats_g: 1.0, type: 'Breakfast', iconType: 'Utensils', recipe: 'يضاف إليه الليمون والكمون وملعقة صغيرة طحينة خام (بدون زيت عادي).', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian'] },
  { name: 'جبنة قريش كريمية', calories: 98, protein_g: 11.0, carbs_g: 3.0, fats_g: 4.0, type: 'Breakfast', iconType: 'Cheese', recipe: 'تضرب في الخلاط مع ملعقة حليب خالي الدسم ورشة زعتر لتصبح كريمية.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['High Protein'] },
  { name: 'شاورما دجاج صحية', calories: 200, protein_g: 24.0, carbs_g: 5.0, fats_g: 9.0, type: 'MainMeal', iconType: 'Drumstick', recipe: 'تنقع صدور الدجاج في زبادي، ثوم، ليمون، خل، وبهارات شاورما، وتشوح في طاسة غير لاصقة.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein', 'Quick Prep'] },

  { name: 'شيبسي / تايجر (كيس 50ج)', calories: 260, protein_g: 3.0, carbs_g: 26.0, fats_g: 16.0, type: 'Snack', iconType: 'Package', recipe: 'سناك تجاري. يفضل تناوله بحذر أثناء فترة التنشيف (Cutting).', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: [] },
  { name: 'دوريتوس (كيس 50ج)', calories: 250, protein_g: 3.5, carbs_g: 30.0, fats_g: 12.0, type: 'Snack', iconType: 'Package', recipe: 'سناك تجاري مقرمش.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: [] },
  { name: 'بسكويت فريسكا / بيمبو', calories: 140, protein_g: 1.5, carbs_g: 20.0, fats_g: 6.0, type: 'Snack', iconType: 'Cookie', recipe: 'مناسب كمصدر طاقة سريع قبل التمرين (Pre-workout).', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'فشار صحي (3 أكواب)', calories: 90, protein_g: 3.0, carbs_g: 18.0, fats_g: 1.0, type: 'Snack', iconType: 'Package', recipe: 'يحضر في حلة تيفال بنقطة زيت واحدة ورشة ملح، أو في المايكروويف.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'ترمس مسلوق (كوب)', calories: 120, protein_g: 11.0, carbs_g: 13.0, fats_g: 3.0, type: 'Snack', iconType: 'Utensils', recipe: 'يسلق جيداً ويتبل بالكمون والليمون والشطة. مصدر بروتين نباتي ممتاز.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian', 'High Protein'] },
  { name: 'حمص الشام (حلبسة - كوب)', calories: 140, protein_g: 7.0, carbs_g: 22.0, fats_g: 2.5, type: 'Snack', iconType: 'Coffee', recipe: 'يسلق الحمص مع طماطم مبشورة وثوم وكمون وليمون.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian'] },
  { name: 'قهوة سريعة الذوبان / تركي', calories: 10, protein_g: 0.5, carbs_g: 1.0, fats_g: 0.0, type: 'Snack', iconType: 'Coffee', recipe: 'بدون سكر. تزيد معدل الحرق والتركيز قبل التمرين.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Quick Prep'] },

  { name: 'سلطة كولسلو دايت', calories: 60, protein_g: 2.0, carbs_g: 10.0, fats_g: 1.0, type: 'Salad', iconType: 'Carrot', recipe: 'كرنب وجزر مبشور، الصوص: زبادي يوناني بديل المايونيز، ملعقة عسل، خل تفاح.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian', 'Quick Prep'] },
  { name: 'سلطة خضراء متكاملة', calories: 45, protein_g: 1.5, carbs_g: 8.0, fats_g: 0.5, type: 'Salad', iconType: 'Carrot', recipe: 'خيار، طماطم، خس، جرجير، بصل. الدريسينج: ليمون، خل، وكمون.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian'] },
  { name: 'سلطة تونة صحية', calories: 180, protein_g: 28.0, carbs_g: 5.0, fats_g: 4.0, type: 'Salad', iconType: 'Fish', recipe: 'تونة مصفاة جيداً، فلفل ألوان، بصل، ذرة حلوة، ليمون، وملعقة مستردة.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'High', tags: ['High Protein'] },
  { name: 'تبولة دايت', calories: 80, protein_g: 3.0, carbs_g: 12.0, fats_g: 2.0, type: 'Salad', iconType: 'Carrot', recipe: 'بقدونس كثيف مفروم، نعناع، طماطم، قليل من البرغل المنقوع، عصير ليمون وزيت زيتون.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian'] },
  { name: 'سلطة بطاطس مسلوقة', calories: 120, protein_g: 2.5, carbs_g: 25.0, fats_g: 1.0, type: 'Salad', iconType: 'Carrot', recipe: 'مكعبات بطاطس مسلوقة، بقدونس، ثوم مفروم، خل، وكمون.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Vegetarian'] },

  { name: 'صوص الرانش الدايت', calories: 35, protein_g: 3.0, carbs_g: 2.0, fats_g: 1.0, type: 'Snack', iconType: 'Droplet', recipe: 'زبادي يوناني، ثوم وبصل بودرة، شبت وبقدونس مجفف. يقلب جيداً.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'ثومية دايت', calories: 40, protein_g: 2.0, carbs_g: 3.0, fats_g: 2.0, type: 'Snack', iconType: 'Droplet', recipe: 'نشا مطبوخ في ماء، يضرب في الخلاط مع ثوم، زبادي يوناني، وعصرة ليمون.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'كاتشب دايت منزلي', calories: 20, protein_g: 0.5, carbs_g: 4.0, fats_g: 0.0, type: 'Snack', iconType: 'Droplet', recipe: 'صلصة طماطم طبيعية مغلية مع خل تفاح، سكر دايت، ثوم وبصل بودرة، ورشة قرنفل.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'صوص طحينة صحي', calories: 70, protein_g: 2.5, carbs_g: 4.0, fats_g: 5.0, type: 'Snack', iconType: 'Droplet', recipe: 'ملعقة طحينة خام تخفف بزبادي طبيعي، ليمون، كمون، وثوم مفروم.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Medium', tags: ['Vegetarian'] },
  { name: 'صوص المستردة والعسل', calories: 45, protein_g: 0.5, carbs_g: 9.0, fats_g: 0.5, type: 'Snack', iconType: 'Droplet', recipe: 'ملعقة مستردة ديجون تخلط مع نصف ملعقة عسل أبيض وقطرات من الليمون.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },

  { name: 'تشيز كيك دايت', calories: 150, protein_g: 12.0, carbs_g: 15.0, fats_g: 5.0, type: 'Dessert', iconType: 'Cake', recipe: 'القاعدة: شوفان مطحون مع زبدة فول سوداني. الطبقة: جبنة قريش مضروبة مع زبادي يوناني وستيفيا، تبرد في الثلاجة.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['High Protein'] },
  { name: 'براونيز الشوفان الدارك', calories: 180, protein_g: 6.0, carbs_g: 22.0, fats_g: 8.0, type: 'Dessert', iconType: 'Cake', recipe: 'شوفان مطحون، كاكاو خام، بيضة، حليب خالي الدسم، ستيفيا، تسوى في الفرن 15 دقيقة.', recommended_goal: 'Bulking', goal: 'Bulking', budgetLevel: 'Medium', tags: ['Quick Prep'] },
  { name: 'أرز باللبن دايت', calories: 130, protein_g: 5.0, carbs_g: 24.0, fats_g: 1.5, type: 'Dessert', iconType: 'Cake', recipe: 'يستخدم حليب خالي الدسم، كمية أرز أقل، وسكر دايت بدلاً من السكر الأبيض، رشة قرفة.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Quick Prep'] },
  { name: 'مهلبية الشوفان بالقرفة', calories: 140, protein_g: 5.5, carbs_g: 25.0, fats_g: 2.0, type: 'Dessert', iconType: 'Cake', recipe: 'حليب خالي الدسم يغلى مع شوفان كامل، يضاف سكر دايت وقرفة وتبرد.', recommended_goal: 'Cutting', goal: 'Cutting', budgetLevel: 'Low', tags: ['Vegetarian'] },
  { name: 'آيس كريم موز صحي', calories: 105, protein_g: 1.5, carbs_g: 27.0, fats_g: 0.4, type: 'Dessert', iconType: 'Cake', recipe: 'موز مقطع ومجمد يضرب في الكبة حتى يصبح قوامه كريمي، يمكن إضافة كاكاو خام.', recommended_goal: 'Maintenance', goal: 'Maintenance', budgetLevel: 'Low', tags: ['Vegetarian'] },
];
