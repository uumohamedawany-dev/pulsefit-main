import { useMemo, useState, type FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
  ChevronLeft,
  X,
  Target,
  UtensilsCrossed,
  Beef,
  Drumstick,
  Fish,
  Cookie,
  Package,
  Carrot,
  Droplet,
  Cake,
  Coffee,
  Utensils,
  Flame,
  Salad,
  Apple,
  Plus,
  EggFried,
  Wheat,
  HandPlatter,
  Soup,
  Heart,
} from 'lucide-react';
import { GlassPanel, GlassCard } from '@/components/GlassUI';
import { useApp } from '@/context/AppContext';
import { foodDatabase, type FoodItem, type FoodCategory } from '@/data/foodDatabase';
import { scanFoodImage, type FoodScanResult } from '@/lib/api';
import type { QuickAddMealInput } from '@/types';
import { drinkDatabase, type DrinkCategory, type DrinkItem } from '@/data/drinkDatabase';
import { safeReadStorage, safeWriteStorage } from '@/lib/permissions';
import { OfflineMacrosCalculator } from '@/components/OfflineMacrosCalculator';
import { ProGate } from '@/components/ProGate';

export function DietMealsScreen() {
  const { setScreen, theme, dailyStats, addCustomMealEntry } = useApp();
  const [tab, setTab] = useState<FoodCategory>('Breakfast');
  const [nutritionSection, setNutritionSection] = useState<'foods' | 'drinks'>('foods');
  const [drinkCategory, setDrinkCategory] = useState<DrinkCategory>('bulking');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedDrink, setSelectedDrink] = useState<DrinkItem | null>(null);
  const [favoriteDrinks, setFavoriteDrinks] = useState<string[]>(() => {
    const raw = safeReadStorage('pulsefit.favoriteDrinks');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [aiScanLoading, setAiScanLoading] = useState(false);
  const [aiScanResult, setAiScanResult] = useState<FoodScanResult | null>(null);
  const [form, setForm] = useState<QuickAddMealInput>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const foods = useMemo(() => foodDatabase.filter((food) => food.category === tab), [tab]);
  const drinks = useMemo(() => drinkDatabase.filter((drink) => drink.category === drinkCategory), [drinkCategory]);

  const toggleFavoriteDrink = (drinkId: string) => {
    setFavoriteDrinks((current) => {
      const next = current.includes(drinkId) ? current.filter((id) => id !== drinkId) : [...current, drinkId];
      safeWriteStorage('pulsefit.favoriteDrinks', JSON.stringify(next));
      return next;
    });
  };

  const quickLogDrink = (drink: DrinkItem) => {
    addCustomMealEntry({ name: drink.name, calories: drink.calories, protein: drink.protein, carbs: drink.carbs, fat: drink.fats });
  };

  const handleQuickAdd = (event: FormEvent) => {
    event.preventDefault();

    const calories = Number(form.calories);
    if (!Number.isFinite(calories) || calories <= 0) {
      setQuickError('Add a valid item name and calories > 0.');
      return;
    }

    addCustomMealEntry({
      name: form.name,
      calories,
      protein: Number(form.protein ?? 0),
      carbs: Number(form.carbs ?? 0),
      fat: Number(form.fat ?? 0),
    });

    setQuickError(null);
    setForm({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 });
    setIsQuickAddOpen(false);
  };

  const handleAiScan = async () => {
    setAiScanError(null);
    setAiScanLoading(true);

    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt,
        saveToGallery: false,
      });

      if (!photo.base64String) {
        throw new Error('لم يتم اختيار صورة للوجبة.');
      }

      const response = await scanFoodImage({
        imageBase64: photo.base64String,
        mimeType: photo.format ? `image/${photo.format}` : 'image/jpeg',
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'فشل في تحليل الصورة.');
      }

      setAiScanResult(response.data);
      setIsAiScanOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تعذر تحليل الصورة الآن.';
      setAiScanError(message);
    } finally {
      setAiScanLoading(false);
    }
  };

  const saveAiScanResult = () => {
    if (!aiScanResult) {
      return;
    }

    addCustomMealEntry({
      name: aiScanResult.food_name,
      calories: aiScanResult.calories,
      protein: aiScanResult.protein,
      carbs: aiScanResult.carbs,
      fat: aiScanResult.fats,
    });

    setIsAiScanOpen(false);
    setAiScanResult(null);
    setAiScanError(null);
  };

  return (
    <div className="min-h-screen px-4 safe-content-bottom pt-6 safe-top">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/40">Nutrition</span>
            <h1 className="font-display text-3xl font-bold text-white mt-1">Diet & Meals</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="glass-card rounded-2xl p-3 text-white/70 hover:text-neon-cyan transition-all"
              aria-label="Quick add custom calories"
            >
              <Plus size={18} />
            </button>
            <button
              type="button"
              onClick={() => setScreen('dashboard')}
              className="glass-card rounded-2xl p-3 text-white/70 hover:text-neon-cyan transition-all"
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        </div>

        <GlassPanel className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-neon-cyan/80">Food Finder</span>
              <div className="mt-2 flex items-center gap-2">
                <Target size={18} className="text-neon-green" />
                <span className="font-display text-2xl font-bold text-white">Nutrition</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAiScan}
              disabled={aiScanLoading}
              className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neon-cyan transition hover:bg-neon-cyan/15 disabled:opacity-70"
            >
              {aiScanLoading ? 'جارٍ التحليل...' : 'Scan Meal with AI'}
            </button>
            <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/8 px-4 py-2">
              <span className="text-[11px] uppercase text-white/50">Track</span>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-white/70">
                <Flame size={13} className="text-orange-500 animate-pulse" />
                <span className="font-semibold">{dailyStats.caloriesConsumed} / {dailyStats.caloriesGoal} kcal</span>
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-2">
          <button type="button" onClick={() => setNutritionSection((current) => current === 'foods' ? 'drinks' : 'foods')} className={`mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-bold transition ${nutritionSection === 'drinks' ? 'border-neon-pink/40 bg-neon-pink/10 text-neon-pink' : 'border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan'}`}>
            <Droplet size={15} /> المشروبات الرياضية (Drinks)
          </button>
          {nutritionSection === 'foods' ? <div className="grid grid-cols-7 gap-2">
            {(
              [
                { id: 'Breakfast' as FoodCategory, label: 'Breakfast' },
                { id: 'Meal' as FoodCategory, label: 'Meals' },
                { id: 'Snack' as FoodCategory, label: 'Snacks' },
                { id: 'Carb' as FoodCategory, label: 'Base Carbs' },
                { id: 'Protein' as FoodCategory, label: 'Base Protein' },
                { id: 'Vegetables' as FoodCategory, label: 'Veggies' },
                { id: 'Fruits' as FoodCategory, label: 'Fruits' },
              ]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`py-3 rounded-2xl text-[11px] font-semibold transition-all duration-300 ${tab === item.id ? 'bg-white/[0.08] text-neon-cyan' : 'text-white/50 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div> : <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'bulking' as DrinkCategory, label: 'مشروبات الضخامة' },
              { id: 'cutting' as DrinkCategory, label: 'مشروبات التنشيف' },
            ]).map((item) => <button key={item.id} type="button" onClick={() => setDrinkCategory(item.id)} className={`rounded-2xl px-3 py-3 text-[11px] font-bold transition ${drinkCategory === item.id ? 'bg-white/[0.08] text-neon-pink' : 'text-white/50 hover:text-white'}`}>{item.label}</button>)}
          </div>}
        </GlassPanel>

        {nutritionSection === 'foods' ? <div className="space-y-3">
          {foods.map((food) => <FoodCard key={food.name} food={food} onClick={() => setSelectedFood(food)} />)}
        </div> : <ProGate feature="Specialized drinks section"><div className="space-y-3">
          {drinks.map((drink) => <DrinkCard key={drink.id} drink={drink} isFavorite={favoriteDrinks.includes(drink.id)} onFavorite={() => toggleFavoriteDrink(drink.id)} onOpen={() => setSelectedDrink(drink)} onQuickLog={() => quickLogDrink(drink)} />)}
        </div></ProGate>}

        <ProGate feature="Smart TDEE and macro calculator"><OfflineMacrosCalculator /></ProGate>

        {aiScanError && (
          <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200">
            {aiScanError}
          </div>
        )}
      </div>

      {selectedFood && (
        <FoodDetailsModal food={selectedFood} onClose={() => setSelectedFood(null)} />
      )}

      {selectedDrink && <DrinkDetailsModal drink={selectedDrink} isFavorite={favoriteDrinks.includes(selectedDrink.id)} onFavorite={() => toggleFavoriteDrink(selectedDrink.id)} onQuickLog={() => quickLogDrink(selectedDrink)} onClose={() => setSelectedDrink(null)} />}

      {isAiScanOpen && aiScanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAiScanOpen(false)} />
          <div className="relative w-full max-w-md">
            <GlassPanel className="relative overflow-hidden border-neon-cyan/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">AI Food Scanner</span>
                  <h3 className="mt-1 font-display text-2xl font-bold text-white">تم تحليل الوجبة بنجاح!</h3>
                </div>
                <button type="button" onClick={() => setIsAiScanOpen(false)} className="rounded-full p-2 text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-[11px] uppercase tracking-[0.14em] text-white/45">اسم الوجبة</div>
                <div className="mt-2 text-xl font-bold text-white">{aiScanResult.food_name}</div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <MacroCell label="Calories" value={`${aiScanResult.calories} kcal`} color="neon-orange" />
                <MacroCell label="Protein" value={`${aiScanResult.protein}g`} color="neon-green" />
                <MacroCell label="Carbs" value={`${aiScanResult.carbs}g`} color="neon-blue" />
                <MacroCell label="Fats" value={`${aiScanResult.fats}g`} color="neon-pink" />
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAiScanOpen(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white/80"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={saveAiScanResult}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-900"
                >
                  حفظ في المتابعة
                </button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsQuickAddOpen(false)} />
          <div className="relative w-full max-w-md">
            <GlassPanel className="relative overflow-hidden border-neon-cyan/30 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-neon-cyan/80">Quick Add</span>
                  <h3 className="font-display text-2xl font-bold text-white mt-1">Custom Calories</h3>
                </div>
                <button type="button" onClick={() => setIsQuickAddOpen(false)} className="rounded-full p-2 text-white/70 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={handleQuickAdd}>
                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Item Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/40'} focus:border-neon-cyan/60`}
                    placeholder="e.g. Protein Snack"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Calories <span className="text-neon-orange">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={form.calories || ''}
                    onChange={(event) => setForm({ ...form, calories: Number(event.target.value) })}
                    className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/40'} focus:border-neon-cyan/60`}
                    placeholder="Required"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Protein</label>
                    <input type="number" min="0" value={form.protein || ''} onChange={(event) => setForm({ ...form, protein: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/40'} focus:border-neon-cyan/60`} placeholder="g" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Carbs</label>
                    <input type="number" min="0" value={form.carbs || ''} onChange={(event) => setForm({ ...form, carbs: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/40'} focus:border-neon-cyan/60`} placeholder="g" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] uppercase tracking-[0.12em] text-white/60">Fats</label>
                    <input type="number" min="0" value={form.fat || ''} onChange={(event) => setForm({ ...form, fat: Number(event.target.value) })} className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${theme === 'light' ? 'border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/40'} focus:border-neon-cyan/60`} placeholder="g" />
                  </div>
                </div>

                {quickError && <p className="text-[11px] font-semibold text-red-300">{quickError}</p>}

                <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-bold uppercase text-ink-900 transition hover:scale-[1.02]">
                  Add External Calories
                </button>
              </form>
            </GlassPanel>
          </div>
        </div>
      )}
    </div>
  );
}

function DrinkCard({ drink, isFavorite, onFavorite, onOpen, onQuickLog }: { drink: DrinkItem; isFavorite: boolean; onFavorite: () => void; onOpen: () => void; onQuickLog: () => void }) {
  const isBulking = drink.category === 'bulking';
  return (
    <GlassCard className={`overflow-hidden border ${isBulking ? 'border-neon-orange/20' : 'border-neon-green/20'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onOpen} className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${isBulking ? 'bg-neon-orange/10 text-neon-orange' : 'bg-neon-green/10 text-neon-green'}`} aria-label={`عرض تفاصيل ${drink.name}`}><Droplet size={27} /></button>
          <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><button type="button" onClick={onOpen} className="text-left text-sm font-bold leading-5 text-white">{drink.name}</button><button type="button" onClick={onFavorite} className="shrink-0 rounded-xl p-1.5 text-white/45 hover:text-neon-pink" aria-label="حفظ في المفضلة"><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} className={isFavorite ? 'text-neon-pink' : ''} /></button></div><span className={`mt-1 inline-block rounded-full px-2 py-1 text-[9px] font-bold ${isBulking ? 'bg-neon-orange/10 text-neon-orange' : 'bg-neon-green/10 text-neon-green'}`}>{isBulking ? 'ضخامة وزيادة سعرات' : 'تقطيع وتقليل سعرات'}</span></div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2"><MacroCell label="Protein" value={`${drink.protein}g`} color="neon-green" /><MacroCell label="Carbs" value={`${drink.carbs}g`} color="neon-blue" /><MacroCell label="Fats" value={`${drink.fats}g`} color="neon-pink" /><MacroCell label="Cal" value={`${drink.calories} kcal`} color="neon-orange" showFlame /></div>
        <div className="mt-4 flex gap-2"><button type="button" onClick={onQuickLog} className="flex-1 rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-3 py-3 text-[10px] font-black text-ink-900">أضف للمتابعة + السعرات</button><button type="button" onClick={onOpen} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-[10px] font-bold text-white/70">التفاصيل</button></div>
      </div>
    </GlassCard>
  );
}

function DrinkDetailsModal({ drink, isFavorite, onFavorite, onQuickLog, onClose }: { drink: DrinkItem; isFavorite: boolean; onFavorite: () => void; onQuickLog: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} /><div className="relative w-full max-w-md"><GlassPanel className="max-h-[88vh] overflow-y-auto border-neon-pink/30 p-5"><div className="flex items-start justify-between gap-3"><div><span className="text-[11px] uppercase tracking-[0.16em] text-neon-pink">المشروبات الرياضية</span><h3 className="mt-1 font-display text-2xl font-bold text-white">{drink.name}</h3></div><div className="flex items-center gap-1"><button type="button" onClick={onFavorite} className="rounded-full p-2 text-neon-pink"><Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} /></button><button type="button" onClick={onClose} className="rounded-full p-2 text-white/60 hover:text-white"><X size={18} /></button></div></div><div className="mt-4 grid grid-cols-4 gap-2"><MacroCell label="Cal" value={`${drink.calories} kcal`} color="neon-orange" showFlame /><MacroCell label="Protein" value={`${drink.protein}g`} color="neon-green" /><MacroCell label="Carbs" value={`${drink.carbs}g`} color="neon-blue" /><MacroCell label="Fats" value={`${drink.fats}g`} color="neon-pink" /></div><div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-neon-cyan">المكونات</div><ul className="mt-2 space-y-1 text-sm leading-6 text-white/75">{drink.ingredients.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="text-[11px] uppercase tracking-[0.14em] text-neon-green">التحضير</div><ol className="mt-2 space-y-1 text-sm leading-6 text-white/75">{drink.preparation.map((item, index) => <li key={item}>{index + 1}. {item}</li>)}</ol></div><div className="mt-4 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-3 text-sm leading-6 text-neon-cyan">{drink.benefits}</div><button type="button" onClick={onQuickLog} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-neon-cyan to-neon-green px-4 py-3 text-[11px] font-black text-ink-900">أضف كوجبة للنهارده</button></GlassPanel></div></div>
  );
}

function FoodCard({ food, onClick }: { food: FoodItem; onClick: () => void }) {
  const Icon = foodIconMap(food);
  return (
    <GlassCard className="overflow-hidden hover:border-neon-cyan/40 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-neon-cyan/20 bg-white/[0.06] shadow-[0_0_24px_rgba(34,245,214,0.08)] backdrop-blur-xl">
          <Icon size={30} className="text-neon-cyan" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white text-sm leading-snug truncate">{food.name}</span>
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-white/[0.06] text-white/50">
              {food.category}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-[11px]">
            <MacroCell label="Protein" value={`${food.protein}g`} color="neon-green" />
            <MacroCell label="Carbs" value={`${food.carbs}g`} color="neon-blue" />
            <MacroCell label="Fats" value={`${food.fats}g`} color="neon-pink" />
            <MacroCell label="Cal" value={`${food.calories} kcal`} color="neon-orange" showFlame />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function FoodDetailsModal({ food, onClose }: { food: FoodItem; onClose: () => void }) {
  const Icon = foodIconMap(food);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md">
        <GlassPanel className="relative overflow-hidden border-neon-cyan/30">
          <div className="absolute -top-16 -right-12 h-32 w-32 rounded-full bg-neon-cyan/20 blur-3xl" />
          <div className="absolute -bottom-8 -left-12 h-24 w-24 rounded-full bg-neon-blue/20 blur-3xl" />

          <div className="relative p-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-neon-cyan">{food.category}</span>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-white/70 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-neon-cyan/30 bg-white/[0.06] shadow-[0_0_30px_rgba(34,245,214,0.16)]">
                <Icon size={30} className="text-neon-cyan" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">{food.category}</span>
                <h3 className="mt-1 font-display text-2xl font-bold text-white">{food.name}</h3>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2">
                <Flame size={16} className="text-neon-orange" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">Macros</span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <MacroCell label="Protein" value={`${food.protein}g`} color="neon-green" />
                <MacroCell label="Carbs" value={`${food.carbs}g`} color="neon-blue" />
                <MacroCell label="Fats" value={`${food.fats}g`} color="neon-pink" />
                <MacroCell label="Cal" value={`${food.calories} kcal`} color="neon-orange" showFlame />
              </div>
            </div>

            {food.recipeInstructions && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={16} className="text-neon-green" />
                  <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">Recipe Instructions</span>
                </div>
                <p className="mt-3 text-[13px] leading-6 text-white/80">{food.recipeInstructions}</p>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-neon-green" />
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/60">Serving</span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-white/80">{food.servingSize}</p>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function foodIconMap(food: FoodItem): LucideIcon {
  const name = food.name.toLowerCase();

  if (name.includes('shakshouka') || name.includes('eggs') || (name.includes('egg') && !name.includes('salad')) || name.includes('omelette') || name.includes('omelet')) {
    return EggFried;
  }

  if (name.includes('oat') || name.includes('oats') || name.includes('granola') || name.includes('cereal') || name.includes('wheat')) {
    return Wheat;
  }

  if (name.includes('falafel') || name.includes('taameya')) {
    return HandPlatter;
  }

  if (name.includes('cheese salad') || name.includes('qurish cheese') || name.includes('salad')) {
    return Salad;
  }

  if (name.includes('foul') || name.includes('bowl') || name.includes('koshary') || name.includes('soup')) {
    return Soup;
  }

  if (name.includes('chicken')) {
    return Drumstick;
  }

  if (name.includes('beef') || name.includes('hawawshi')) {
    return Beef;
  }

  if (name.includes('fish') || name.includes('bolti') || name.includes('tuna')) {
    return Fish;
  }

  if (name.includes('milk') || name.includes('dates')) {
    return Coffee;
  }

  if (name.includes('banana') || name.includes('apple') || name.includes('orange') || name.includes('watermelon') || name.includes('date')) {
    return Apple;
  }

  if (name.includes('cucumber') || name.includes('tomato') || name.includes('pepper') || name.includes('spinach') || name.includes('broccoli') || name.includes('molokhia')) {
    return Carrot;
  }

  if (name.includes('whey') || name.includes('nuts') || name.includes('peanut') || name.includes('yogurt')) {
    return Package;
  }

  const map: Record<FoodCategory, LucideIcon> = {
    Carb: Utensils,
    Protein: Drumstick,
    Breakfast: Coffee,
    Meal: UtensilsCrossed,
    Snack: Cookie,
    Vegetables: Carrot,
    Fruits: Apple,
  };

  return map[food.category] ?? Utensils;
}

function CheeseIcon({ size = 30, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none" aria-label="cheese">
      <rect x="6" y="7" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="1.4" fill="rgba(255,255,255,0.04)" />
      <circle cx="11" cy="12" r="2" fill="currentColor" opacity="0.9" />
      <circle cx="17" cy="17" r="2" fill="currentColor" opacity="0.85" />
      <circle cx="23" cy="12" r="2" fill="currentColor" opacity="0.78" />
      <path d="M8 22h15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}


function MacroCell({ label, value, color, showFlame = false }: { label: string; value: string; color: string; showFlame?: boolean }) {
  const colors: Record<string, string> = {
    'neon-green': 'text-neon-green',
    'neon-blue': 'text-neon-blue',
    'neon-pink': 'text-neon-pink',
    'neon-orange': 'text-neon-orange',
  };

  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-white/40 uppercase">{label}</span>
      <span className={`flex items-center gap-1 text-[11px] font-semibold ${colors[color]}`}> 
        {showFlame && <Flame size={11} className="text-orange-500 animate-pulse" />}
        {value}
      </span>
    </div>
  );
}
