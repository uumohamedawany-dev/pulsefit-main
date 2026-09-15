export type FoodCategory =
  | 'Breakfast'
  | 'Meal'
  | 'Snack'
  | 'Carb'
  | 'Protein'
  | 'Vegetables'
  | 'Fruits';

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recipeInstructions?: string;

  // Optional compatibility aliases for older UI and renderers.
  type?: FoodType;
  iconType?: FoodIconType;
  recipe?: string;
  recommended_goal?: FoodGoal;
  goal?: FoodGoal;
  budgetLevel?: FoodBudgetLevel;
  tags?: FoodPreferenceTag[];
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
}

export const foodDatabase: FoodItem[] = [
  // Base ingredients and staple macros from the previous Egyptian nutrition update.
  { id: 'egyptian-white-rice', name: 'Egyptian White Rice', category: 'Carb', servingSize: '100g cooked', calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
  { id: 'basmati-rice', name: 'Basmati Rice', category: 'Carb', servingSize: '100g cooked', calories: 121, protein: 3.5, carbs: 25, fats: 0.4 },
  { id: 'egyptian-baladi-bread', name: 'Egyptian Baladi Bread', category: 'Carb', servingSize: '1 loaf (~100g)', calories: 275, protein: 9, carbs: 55, fats: 1 },
  { id: 'sweet-potato-batata', name: 'Sweet Potato (Batata - Baked)', category: 'Carb', servingSize: '100g baked', calories: 90, protein: 2, carbs: 21, fats: 0.1 },
  { id: 'rolled-oats', name: 'Rolled Oats', category: 'Carb', servingSize: '100g dry', calories: 389, protein: 16.9, carbs: 66, fats: 6.9 },

  { id: 'grilled-chicken-breast', name: 'Grilled Chicken Breast', category: 'Protein', servingSize: '100g cooked', calories: 165, protein: 31, carbs: 0, fats: 3.6 },
  { id: 'lean-minced-beef-9010', name: 'Lean Minced Beef (90/10)', category: 'Protein', servingSize: '100g cooked', calories: 250, protein: 26, carbs: 0, fats: 15 },
  { id: 'tilapia-bolti-grilled', name: 'Tilapia Fish (Bolti - Grilled)', category: 'Protein', servingSize: '100g cooked', calories: 128, protein: 26, carbs: 0, fats: 2.7 },
  { id: 'qurish-cheese', name: 'Qurish Cheese (Cottage Cheese)', category: 'Protein', servingSize: '100g', calories: 98, protein: 11, carbs: 3, fats: 4 },
  { id: 'whole-egg', name: 'Whole Egg', category: 'Protein', servingSize: '1 large egg', calories: 78, protein: 6, carbs: 0.5, fats: 5 },
  { id: 'egg-white', name: 'Egg White', category: 'Protein', servingSize: '1 large egg white', calories: 17, protein: 3.6, carbs: 0, fats: 0 },

  // Breakfast (keep the requested breakfast rows)
  { id: 'foul-medames-bowl', name: 'Foul Medames Bowl', category: 'Breakfast', servingSize: '150g Foul + 1 tbsp Olive Oil + Cumin', calories: 280, protein: 12, carbs: 30, fats: 15, recipeInstructions: 'Heat 150g of canned or cooked foul. Add 1 tbsp olive oil, a pinch of cumin, salt, and squeeze half a lemon. Serve with Baladi bread.' },
  { id: 'qurish-cheese-salad', name: 'Qurish Cheese Salad', category: 'Breakfast', servingSize: '150g Qurish + Tomatoes/Cucumbers + 1 tsp Olive Oil', calories: 180, protein: 17, carbs: 8, fats: 9, recipeInstructions: 'Mash 150g of Qurish cheese with a fork. Dice 1 small tomato and 1 cucumber. Mix them together and drizzle 1 tsp of olive oil on top.' },
  { id: 'fit-shakshouka', name: 'Fit Shakshouka', category: 'Breakfast', servingSize: '3 Whole Eggs + Veggies', calories: 280, protein: 20, carbs: 10, fats: 16, recipeInstructions: 'Sauté diced onions and bell peppers in a non-stick pan until soft. Add diced fresh tomatoes and cook until a sauce forms. Crack 3 whole eggs over the sauce, cover, and let simmer until the eggs are cooked to your liking.' },
  { id: 'oats-egyptian-dates', name: 'Oats with Egyptian Dates', category: 'Breakfast', servingSize: '50g Oats + 3 Dates + 100ml Skim Milk', calories: 330, protein: 13, carbs: 65, fats: 4, recipeInstructions: 'Boil 100ml skim milk (or water). Stir in 50g rolled oats. Reduce heat and simmer for 5 minutes. Chop 3 dates and stir them in along with a pinch of cinnamon.' },
  { id: 'baked-taameya', name: 'Baked Taameya (Falafel)', category: 'Breakfast', servingSize: '3 pieces', calories: 150, protein: 8, carbs: 18, fats: 5 },

  // Main meals (Lunch & Dinner), requested by the user.
  { id: 'chicken-basmati-power-bowl', name: 'Chicken & Basmati Power Bowl', category: 'Meal', servingSize: '150g Grilled Chicken + 150g Basmati Rice + Veggies', calories: 450, protein: 45, carbs: 40, fats: 5, recipeInstructions: 'Grill 150g of seasoned chicken breast. Cook 150g of basmati rice using a rice cooker or stovetop method. Serve together with a side of steamed veggies.' },
  { id: 'egyptian-beef-rice', name: 'Egyptian Beef & Rice', category: 'Meal', servingSize: '150g Lean Minced Beef + 150g Egyptian White Rice', calories: 550, protein: 40, carbs: 45, fats: 20, recipeInstructions: 'Brown 150g lean minced beef in a pan with onions and preferred spices. Cook 150g Egyptian white rice separately. Serve the beef over the rice.' },
  { id: 'grilled-bolti-sweet-potato', name: 'Grilled Bolti (Tilapia) & Sweet Potato', category: 'Meal', servingSize: '200g Grilled Fish + 150g Baked Sweet Potato', calories: 350, protein: 50, carbs: 30, fats: 5, recipeInstructions: 'Season tilapia with cumin, garlic, and lemon, then grill until flaky. Wash and bake a sweet potato until tender. Serve together.' },

  // Snacks, including Egyptian gym staples requested by the user.
  { id: 'lupini-beans-termes', name: 'Lupini Beans (Termes - 100g)', category: 'Snack', servingSize: '100g', calories: 119, protein: 16, carbs: 13, fats: 3 },
  { id: 'greek-yogurt-honey', name: 'Greek Yogurt with Honey', category: 'Snack', servingSize: '1 serving', calories: 150, protein: 15, carbs: 15, fats: 0 },
  { id: 'banana-peanut-butter', name: 'Banana & Peanut Butter (1 tbsp)', category: 'Snack', servingSize: '1 banana + 1 tbsp peanut butter', calories: 195, protein: 5, carbs: 30, fats: 8 },
  { id: 'mixed-nuts-30g', name: 'Mixed Nuts (30g)', category: 'Snack', servingSize: '30g', calories: 170, protein: 6, carbs: 6, fats: 14 },
  { id: 'standard-whey-shake', name: 'Standard Whey Protein Shake (1 scoop in water)', category: 'Snack', servingSize: '1 scoop in water', calories: 120, protein: 24, carbs: 3, fats: 1 },

  // More fit Egyptian meals appended to Meals (Lunch/Dinner) category.
  { id: 'air-fried-fit-hawawshi', name: 'Air-Fried Fit Hawawshi', category: 'Meal', servingSize: '1 serving', calories: 380, protein: 30, carbs: 40, fats: 10, recipeInstructions: 'Mix lean minced meat with finely diced onions, bell peppers, and Hawawshi spices. Stuff into half a whole wheat Baladi loaf. Brush with a tiny bit of olive oil and air-fry or bake until crispy.' },
  { id: 'tuna-pasta-macarona-bel-toona', name: 'Tuna Pasta (Macarona bel Toona)', category: 'Meal', servingSize: '1 serving', calories: 420, protein: 35, carbs: 50, fats: 8, recipeInstructions: 'Drain one can of tuna in water. Toss with 100g cooked whole wheat pasta, diced tomatoes, colored peppers, and a squeeze of lemon.' },
  { id: 'fit-koshary', name: 'Fit Koshary', category: 'Meal', servingSize: '1 serving', calories: 450, protein: 18, carbs: 75, fats: 8, recipeInstructions: 'Boil lentils, chickpeas, and pasta separately. Mix with a small portion of cooked rice. Top with homemade, oil-free tomato sauce and a dash of cumin.' },
  { id: 'winter-lentil-soup-shorbet-ads', name: 'Winter Lentil Soup (Shorbet Ads)', category: 'Meal', servingSize: '1 serving', calories: 320, protein: 18, carbs: 50, fats: 4, recipeInstructions: 'Boil yellow lentils with a carrot, onion, tomato, and garlic. Blend until smooth. Season with cumin and serve hot with toasted whole wheat bread.' },

  // Vegetables (append requested and keep previously generated categories intact)
  { id: 'cucumber-khiyar', name: 'Cucumber (Khiyar)', category: 'Vegetables', servingSize: '100g raw', calories: 15, protein: 0.6, carbs: 3.6, fats: 0.1 },
  { id: 'tomato-tamatem', name: 'Tomato (Tamatem)', category: 'Vegetables', servingSize: '100g raw', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2 },
  { id: 'bell-pepper-felfel', name: 'Bell Pepper (Felfel)', category: 'Vegetables', servingSize: '100g raw', calories: 20, protein: 0.9, carbs: 4.6, fats: 0.2 },
  { id: 'spinach-sabanekh', name: 'Spinach (Sabanekh)', category: 'Vegetables', servingSize: '100g raw', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4 },
  { id: 'broccoli', name: 'Broccoli', category: 'Vegetables', servingSize: '100g raw', calories: 34, protein: 2.8, carbs: 6.6, fats: 0.4 },
  { id: 'molokhia-raw-leaves', name: 'Molokhia (Raw Leaves)', category: 'Vegetables', servingSize: '100g raw', calories: 34, protein: 4.5, carbs: 5.8, fats: 0.1 },

  // Fruits (append requested and keep previously generated categories intact)
  { id: 'banana-moz', name: 'Banana (Moz)', category: 'Fruits', servingSize: '100g raw', calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3 },
  { id: 'apple-tofah', name: 'Apple (Tofah)', category: 'Fruits', servingSize: '100g raw', calories: 52, protein: 0.3, carbs: 14, fats: 0.2 },
  { id: 'watermelon-bateekh', name: 'Watermelon (Bateekh)', category: 'Fruits', servingSize: '100g raw', calories: 30, protein: 0.6, carbs: 8, fats: 0.2 },
  { id: 'orange-bortoqan', name: 'Orange (Bortoqan)', category: 'Fruits', servingSize: '100g raw', calories: 47, protein: 0.9, carbs: 12, fats: 0.1 },
  { id: 'dates-balah-fresh', name: 'Dates (Balah - Fresh)', category: 'Fruits', servingSize: '100g raw', calories: 282, protein: 2.5, carbs: 75, fats: 0.4 },
];

export type FoodGoal = 'Cutting' | 'Bulking' | 'Maintenance';
export type FoodBudgetLevel = 'Low' | 'Medium' | 'High';
export type FoodPreferenceTag = 'Vegetarian' | 'High Protein' | 'Quick Prep' | 'No Fish' | 'No Meat' | 'No Dairy';

export type FoodType = 'Breakfast' | 'MainMeal' | 'Snack' | 'Dessert' | 'Salad';
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

export interface LegacyFoodItem {
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

export const foodData = foodDatabase;
