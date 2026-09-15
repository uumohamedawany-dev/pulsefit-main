import type { AppMode, WorkoutCategory, WorkoutExercise, WorkoutMode } from '@/types';

function exercise(
  name: string,
  sets: number,
  reps: string,
  rest: number,
  type: WorkoutMode,
  icon: string,
  photoId: string,
  tips: string[],
  instructions?: string[],
): WorkoutExercise {
  return {
    name,
    sets,
    reps,
    rest,
    type,
    icon,
    imageUrl: '',
    tips,
    instructions: instructions ?? tips,
  };
}

const baseWorkoutDatabase: Record<WorkoutCategory, WorkoutExercise[]> = {
  Chest: [
    exercise('Barbell Bench Press (بنش برس فلات)', 4, '8-12', 90, 'Gym', 'Dumbbell', 'photo-1517838277536-f5f99be501cd', [
      'Plant your feet and keep a slight arch in the upper back.',
      'Lower the bar to mid-chest with control.',
      'Press up without bouncing the bar off your chest.',
    ]),
    exercise('Incline Dumbbell Press (تجميع عالي بالدمبل)', 4, '10-12', 90, 'Gym', 'Dumbbell', 'photo-1532029837519-abc0fcadd93e', [
      'Set the bench between 30 and 45 degrees.',
      'Keep dumbbells stacked over the upper chest.',
      'Stop just short of locking out to keep tension.',
    ]),
    exercise('Cable Crossover (تفتيح بالكابل)', 3, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1549060279-7e367ea3d27a', [
      'Step forward so the cables stay loaded at the bottom.',
      'Sweep from high to low with a slight elbow bend.',
      'Squeeze the chest for a full second at the midline.',
    ]),
    exercise('Pec Deck Machine (تفتيح جهاز فراشة)', 3, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1594381898411-846e32d7670c', [
      'Set the seat so handles meet at mid-chest.',
      'Keep shoulder blades pinned to the pad.',
      'Control the opening phase — do not hyperextend.',
    ]),
    exercise('Standard Push-ups (ضغط عادي)', 4, 'To Failure', 60, 'Home', 'Activity', 'photo-1598971639058-fab3c3109a00', [
      'Hands under shoulders, body in one straight line.',
      'Lower until the chest nearly touches the floor.',
      'Drive through the palms without flaring the elbows wide.',
    ]),
    exercise('Decline Push-ups (ضغط رجلك على كرسي)', 3, '10-15', 60, 'Home', 'Activity', 'photo-1571019614242-c5c5dee9f50b', [
      'Elevate the feet on a stable chair or box.',
      'Keep the core tight so the hips do not sag.',
      'Aim the chest forward, not the forehead down.',
    ]),
    exercise('Diamond Push-ups (ضغط الماسة)', 3, 'To Failure', 60, 'Home', 'Activity', 'photo-1566241142559-40e1dab266c6', [
      'Place thumbs and index fingers into a diamond.',
      'Keep elbows close to the ribs.',
      'This is a chest and triceps closer — stay compact.',
    ]),
    exercise('Wide Grip Push-ups (ضغط واسع)', 3, '12-15', 60, 'Home', 'Activity', 'photo-1599058945522-28d584b6f14f', [
      'Hands outside shoulder width to bias the chest.',
      'Lower with a controlled 2-second eccentric.',
      'Do not let the lower back collapse.',
    ]),
  ],
  Back: [
    exercise('Lat Pulldown (سحب عالي جهاز)', 4, '10-12', 90, 'Gym', 'Dumbbell', 'photo-1584863231364-2edc166de576', [
      'Pull the bar to the upper chest, not behind the neck.',
      'Drive the elbows down and slightly back.',
      'Pause with the lats squeezed before the slow return.',
    ]),
    exercise('Barbell Row (سحب أرضي بالبار)', 4, '8-10', 90, 'Gym', 'Dumbbell', 'photo-1601422407692-ec4eeec1d9b3', [
      'Hinge until the torso is near 45 degrees.',
      'Row the bar to the lower ribs.',
      'Keep the neck neutral and the lower back braced.',
    ]),
    exercise('Seated Cable Row (سحب أرضي كابل)', 3, '10-12', 90, 'Gym', 'Dumbbell', 'photo-1507398941214-572c5f59d953', [
      'Sit tall — do not swing the torso for momentum.',
      'Pull the handle into the belly button.',
      'Retract the shoulder blades without shrugging.',
    ]),
    exercise('Deadlift (رفعة ميتة)', 3, '5-8', 120, 'Gym', 'Dumbbell', 'photo-1541534741688-6078c6bfb5c5', [
      'Bar over mid-foot, shins close, lats packed.',
      'Push the floor away and lock hips and knees together.',
      'Lower with a hinged hip, not a rounded spine.',
    ]),
    exercise('Pull-ups (عقلة واسع)', 4, 'To Failure', 90, 'Home', 'Activity', 'photo-1603287681836-b174ce5074c2', [
      'Use a wide overhand grip.',
      'Pull until the chin clears the bar.',
      'Lower to a full hang without losing shoulder packing.',
    ]),
    exercise('Chin-ups (عقلة ضيق مقلوب)', 3, 'To Failure', 90, 'Home', 'Activity', 'photo-1434682881908-b43d0467b798', [
      'Use a supinated shoulder-width grip.',
      'Lead with the chest, not the chin only.',
      'This overloads the biceps and lower lats.',
    ]),
    exercise('Superman Holds (ثبات سوبرمان للقطنية)', 3, '45 Seconds', 60, 'Home', 'Activity', 'photo-1518611012118-696072aa579a', [
      'Lie face down and lift chest, arms, and legs together.',
      'Keep the neck in line with the spine.',
      'Squeeze the glutes to protect the lower back.',
    ]),
    exercise('Inverted Row (سحب تحت ترابيزة)', 3, '10-15', 60, 'Home', 'Activity', 'photo-1571019613576-2b22c76fd955', [
      'Hold a sturdy table edge with a rigid plank body.',
      'Pull the chest to the edge.',
      'The more horizontal you are, the harder it gets.',
    ]),
  ],
  Legs: [
    exercise('Barbell Squats (سكوات حر بالبار)', 4, '8-10', 120, 'Gym', 'Dumbbell', 'photo-1517963879433-6ad2b056d146', [
      'Brace the core before you unrack.',
      'Sit between the hips, knees tracking over toes.',
      'Drive up through mid-foot without collapsing inward.',
    ]),
    exercise('Leg Press (مكبس رجلين)', 4, '10-12', 90, 'Gym', 'Dumbbell', 'photo-1518310383802-640c2f305325', [
      'Place feet mid-platform, shoulder width.',
      'Lower until the thighs reach at least 90 degrees.',
      'Do not lock the knees violently at the top.',
    ]),
    exercise('Romanian Deadlift (رومانيان ديدليفت)', 3, '8-12', 90, 'Gym', 'Dumbbell', 'photo-1546483875-ad9014c88eba', [
      'Soft knees, bar close to the legs.',
      'Hinge until you feel a hamstring stretch.',
      'Stand by squeezing the glutes, not yanking the back.',
    ]),
    exercise('Leg Extensions (رفرفة أمامي جهاز)', 3, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1574680096145-d05b474e2155', [
      'Align the pad with the lower shin, not the foot.',
      'Extend fully and squeeze the quads.',
      'Lower slowly to keep the knees happy.',
    ]),
    exercise('Calf Raises (سمانة على الجهاز)', 4, '15-20', 60, 'Gym', 'Dumbbell', 'photo-1476480862126-209bfaa8edc8', [
      'Pause in a deep stretch at the bottom.',
      'Rise onto the big-toe side of the foot.',
      'Hold the squeeze for one second at the top.',
    ]),
    exercise('Bodyweight Squats (سكوات بوزن الجسم)', 4, '20-25', 60, 'Home', 'Activity', 'photo-1550345332-09e3ac987658', [
      'Reach the hips back and down with a proud chest.',
      'Keep heels heavy on the floor.',
      'Stand up by pushing the floor away.',
    ]),
    exercise('Walking Lunges (طعنات متحركة)', 3, '15 per leg', 60, 'Home', 'Activity', 'photo-1434608519348-875f0fd77e48', [
      'Long enough stride so the front shin stays vertical.',
      'Drop the back knee toward the floor.',
      'Push through the front heel to the next step.',
    ]),
    exercise('Bulgarian Split Squats (سكوات بلغاري)', 3, '10-12 per leg', 60, 'Home', 'Activity', 'photo-1536922246289-88c42f957773', [
      'Rear foot on a chair, front foot far enough forward.',
      'Most of the load stays on the front leg.',
      'Keep the torso slightly leaned forward over the quad.',
    ]),
    exercise('Glute Bridges (رفعة الحوض)', 3, '15-20', 45, 'Home', 'Activity', 'photo-1571019613454-1cb2f99b2d8b', [
      'Heels close enough that shins are vertical at the top.',
      'Ribs down, squeeze glutes to lift the hips.',
      'Do not over-arch the lower back.',
    ]),
  ],
  Shoulders: [
    exercise('Overhead Dumbbell Press (تجميع كتف دمبل)', 4, '8-12', 90, 'Gym', 'Dumbbell', 'photo-1574680178050-55c6a6a96e0a', [
      'Press in a slight arc, not behind the head.',
      'Keep ribs down so the lower back does not dump.',
      'Lower to ear level with control.',
    ]),
    exercise('Lateral Raises (رفرفة جانبي للكتف)', 4, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1518310790390-836058cb000b', [
      'Lead with the elbows, thumbs slightly down.',
      'Stop at shoulder height — no swinging.',
      'Think of pouring water from a pitcher at the top.',
    ]),
    exercise('Face Pulls (سحب حبل على الوجه)', 3, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1637666062717-1c6bcfa4a4df', [
      'Set the cable at face height with a rope.',
      'Pull toward the eyes and externally rotate.',
      'This builds rear delts and healthy shoulders.',
    ]),
    exercise('Front Raises (رفرفة أمامي بالدمبل)', 3, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1598266668581-71702693591b', [
      'Raise to eye level with a slight elbow bend.',
      'Do not lean back to cheat the weight up.',
      'Lower on a 2-count to load the front delts.',
    ]),
    exercise('Pike Push-ups (ضغط هندي للكتف)', 4, '8-12', 60, 'Home', 'Activity', 'photo-1544367567-0f2fcb009e0b', [
      'Hips high, head toward the floor between the hands.',
      'This mimics an overhead press without weights.',
      'Keep elbows about 45 degrees from the torso.',
    ]),
    exercise('Handstand Hold (ثبات وقوف على اليدين)', 3, '30 Seconds', 60, 'Home', 'Activity', 'photo-1506126613408-eca07ce68773', [
      'Kick up to a wall and stack shoulders over wrists.',
      'Hollow the ribcage and squeeze the glutes.',
      'Push the floor away the entire hold.',
    ]),
    exercise('Arm Circles (دوائر بالذراعين)', 3, '60 Seconds', 45, 'Home', 'Activity', 'photo-1521805103424-d8f8430e8933', [
      'Arms at shoulder height, small then larger circles.',
      'Keep the shoulders packed, not shrugged.',
      'Reverse direction halfway through the set.',
    ]),
  ],
  Arms: [
    exercise('Barbell Bicep Curls (بايسپس بالبار)', 4, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1581009146145-b5ef050c0020', [
      'Elbows pinned beside the ribs.',
      'Curl until the biceps fully shorten.',
      'Lower slowly — no swinging the torso.',
    ]),
    exercise('Tricep Rope Pushdown (تريسبس حبل)', 4, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1597452485669-2c7bb5fef90d', [
      'Upper arms stay glued to the sides.',
      'Spread the rope apart at the bottom.',
      'Stop before the elbows drift forward.',
    ]),
    exercise('Hammer Curls (تبادل شاكوش)', 3, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1579758629938-03607ccdbaba', [
      'Neutral grip, thumbs up the whole time.',
      'This loads the brachialis and forearms.',
      'Curl without rotating the wrists.',
    ]),
    exercise('Overhead Tricep Ext (تريسبس خلفي بالدمبل)', 3, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1580083180314-bf6e1657f3d1', [
      'Elbows point forward, not flared wide.',
      'Stretch the triceps at the bottom.',
      'Extend until the elbows nearly lock.',
    ]),
    exercise('Chair Dips (غطس على الكرسي)', 4, '12-15', 60, 'Home', 'Activity', 'photo-1558017487-0608146e3c1e', [
      'Hands on a stable chair, hips close to the edge.',
      'Bend the elbows to about 90 degrees.',
      'Keep shoulders down — do not shrug into the neck.',
    ]),
    exercise('Diamond Push-ups (ضغط ماسة للتريسبس)', 3, 'To Failure', 60, 'Home', 'Activity', 'photo-1566241142559-40e1dab266c6', [
      'Hands in a tight diamond under the sternum.',
      'Elbows graze the ribs on the way down.',
      'This is a triceps-biased push-up, not a wide chest press.',
    ]),
    exercise('Towel Bicep Curls (بايسپس باستخدام منشفة)', 3, '15', 60, 'Home', 'Activity', 'photo-1540497077202-7c8a3999166f', [
      'Stand on a towel and curl against isometric tension.',
      'Match the effort on both arms.',
      'Hold the peak squeeze for two seconds.',
    ]),
  ],
  Abs: [
    exercise('Cable Crunches (كرنشز كابل للبطن)', 4, '15-20', 60, 'Gym', 'Dumbbell', 'photo-1611672585731-fa10603fb9e0', [
      'Kneel and crunch the ribcage toward the hips.',
      'Do not pull with the arms — the abs close the gap.',
      'Exhale hard at the bottom of each rep.',
    ]),
    exercise('Hanging Leg Raises (رفع الرجلين على العقلة)', 3, '10-15', 60, 'Gym', 'Dumbbell', 'photo-1532384748853-8f54a8f476e2', [
      'Dead-hang first, then raise legs without swinging.',
      'Posteriorly tilt the pelvis at the top.',
      'Lower slowly to keep the hip flexors honest.',
    ]),
    exercise('Weighted Russian Twists (تويست بوزن)', 3, '20', 60, 'Gym', 'Dumbbell', 'photo-1605296867304-46d5465a13f1', [
      'Lean back with a long spine.',
      'Rotate the shoulders, not just the arms.',
      'Tap the weight beside each hip with control.',
    ]),
    exercise('Crunches (كرنشز على الأرض)', 4, '20-25', 45, 'Home', 'Activity', 'photo-1483721310020-03333e577078', [
      'Curl the ribcage up, leaving the lower back down.',
      'Hands lightly at the temples — no yanking the neck.',
      'Pause one second at the top.',
    ]),
    exercise('Plank (ثبات بلانك)', 4, '60 Seconds', 45, 'Home', 'Activity', 'photo-1599058917765-a780eda07a3e', [
      'Elbows under shoulders, glutes squeezed.',
      'Push the floor away to keep a hollow torso.',
      'Do not let the hips pike or sag.',
    ]),
    exercise('Bicycle Crunches (عجلة للبطن)', 3, '30', 45, 'Home', 'Activity', 'photo-1534367610401-9f5ed68180aa', [
      'Opposite elbow to opposite knee.',
      'Slow the pace so the rotation stays honest.',
      'Keep the lower back pressed into the floor.',
    ]),
    exercise('Hollow Body Hold (ثبات جسم مجوف)', 3, '45 Seconds', 60, 'Home', 'Activity', 'photo-1544367567-0f2fcb009e0b', [
      'Press the lower back into the floor.',
      'Arms and legs long, hovering off the ground.',
      'Breathe shallow and stay hollow — no arching.',
    ]),
  ],
};

const femaleWorkoutDatabase: Record<WorkoutCategory, WorkoutExercise[]> = {
  Chest: [
    ...baseWorkoutDatabase.Chest.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Chest.filter((item) => item.type === 'Gym'),
    exercise('Incline Chest Press (تجميع صدر بالدمبل)', 3, '10-12', 75, 'Gym', 'Dumbbell', 'photo-1579820010410-c982b0a7d76d', [
      'Keep the shoulder blades pulled back and down.',
      'Use a controlled range of motion to emphasize chest activation.',
      'Pause briefly at the top to feel the pec contraction.',
    ]),
    exercise('Floor Press (ضغط على الأرض)', 3, '12-15', 60, 'Gym', 'Dumbbell', 'photo-1526506118085-60ce8714f8c5', [
      'Keep the elbows at about 45 degrees.',
      'The floor limits overextension and keeps the movement honest.',
      'Squeeze the chest at the top instead of locking the elbows hard.',
    ]),
  ],
  Back: [
    ...baseWorkoutDatabase.Back.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Back.filter((item) => item.type === 'Gym'),
    exercise('Lat Pulldowns (سحب عالي)', 3, '12', 75, 'Gym', 'Dumbbell', 'photo-1584863231364-2edc166de576', [
      'Pull the bar to the upper chest, not behind the neck.',
      'Drive the elbows down and slightly back.',
      'Pause with the lats squeezed before the slow return.',
    ], [
      'Sit tall, grip the bar slightly wider than shoulder-width, and pull it down toward the upper chest.',
      'Keep your chest lifted and avoid leaning back to generate momentum.',
      'Slowly return to the starting position and repeat with control.',
    ]),
    exercise('Single-Arm Lat Pulldown (سحب جانبي كابل)', 3, '10-12 per side', 75, 'Gym', 'Dumbbell', 'photo-1594381898411-846e32d7670c', [
      'Keep the ribcage down and the spine tall.',
      'Pull the elbow toward the hip, not the neck.',
      'Pause briefly with the shoulder blade set.',
    ]),
    exercise('Chest-Supported Row (سحب دعم صدر)', 3, '12-15', 75, 'Gym', 'Dumbbell', 'photo-1534608834748-9a84d7e9c091', [
      'Brace the chest on the pad for a clean torso angle.',
      'Row to the lower ribcage and squeeze the upper back.',
      'Maintain a soft bend in the knees.',
    ]),
  ],
  Legs: [
    ...baseWorkoutDatabase.Legs.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Legs.filter((item) => item.type === 'Gym'),
    exercise('Leg Press (دفع رجلي)', 4, '10', 90, 'Gym', 'Dumbbell', 'photo-1517838277536-f5f99be501cd', [
      'Set the seat so your knees track over the toes.',
      'Lower the platform with control until the knees are near a comfortable bend.',
      'Drive up through the mid-foot and keep your torso stable.',
    ], [
      'Sit in the machine with your back flat against the pad and feet shoulder-width apart.',
      'Push the platform away until your legs are nearly straight, then lower slowly with control.',
      'Keep your knees tracking in line with your toes for the full set.',
    ]),
    exercise('Barbell Hip Thrusts (رفع الحوض بالبار)', 4, '10-12', 90, 'Gym', 'Dumbbell', 'photo-1541534741688-6078c6bfb5c5', [
      'Plant your feet and drive through the floor to raise the hips.',
      'Keep the ribcage down and the glutes squeezed at the top.',
      'Pause briefly at the top to feel the full hip extension.',
    ], [
      'Sit with your upper back on the bench and bar across your hips.',
      'Drive through your feet to lift the hips until your body forms a straight line from shoulders to knees.',
      'Pause for one second at the top, then lower slowly and repeat.',
    ]),
    exercise('Dumbbell Romanian Deadlifts (RDLs) (رومانيان ديدليفت بالدمبل)', 4, '12', 90, 'Gym', 'Dumbbell', 'photo-1546483875-ad9014c88eba', [
      'Keep a soft bend in the knees and hinge through the hips.',
      'Let the dumbbells travel close to the legs.',
      'Squeeze the glutes at the top without hyperextending the back.',
    ], [
      'Stand tall with a dumbbell in each hand, palms facing your thighs.',
      'Hinge at the hips and lower the weights down the front of your legs until you feel a hamstring stretch.',
      'Drive the hips forward to return to standing and squeeze the glutes at the top.',
    ]),
    exercise('Cable Glute Kickbacks (رفع الحوض كابل)', 3, '15', 60, 'Gym', 'Dumbbell', 'photo-1517838277536-f5f99be501cd', [
      'Anchor the ankle strap and keep the torso stable.',
      'Drive the heel back and up without twisting the pelvis.',
      'Control the return so the glutes stay loaded.',
    ], [
      'Attach an ankle strap to a low cable and stand facing the machine.',
      'Keep your torso tall and extend the working leg straight behind you, squeezing the glute at the top.',
      'Lower slowly and repeat with control for the full set.',
    ]),
    exercise('Glute Bridge March (رفع حوض مع المشي)', 3, '12 per side', 45, 'Home', 'Activity', 'photo-1541534741688-6078c6bfb5c5', [
      'Drive through the heels and keep hips level.',
      'Only alternate one leg at a time while maintaining tension.',
      'Use a slow tempo so the glutes stay engaged.',
    ]),
    exercise('Sumo Squat Hold (سكوات سمو مع ثبات)', 3, '45 Seconds', 45, 'Home', 'Activity', 'photo-1517838277536-f5f99be501cd', [
      'Stand wide and toes slightly out.',
      'Sit back and keep the chest proud.',
      'Hold the bottom position and brace the core.',
    ]),
  ],
  Shoulders: [
    ...baseWorkoutDatabase.Shoulders.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Shoulders.filter((item) => item.type === 'Gym'),
    exercise('Dumbbell Shoulder Press (تجميع كتف بالدمبل)', 3, '10', 75, 'Gym', 'Dumbbell', 'photo-1506126613408-eca07ce68773', [
      'Keep a neutral spine and avoid arching the low back.',
      'Press the dumbbells up with your shoulders, not your neck.',
      'Lower with control to keep tension through the full range.',
    ], [
      'Sit tall with a dumbbell in each hand at shoulder height.',
      'Press both weights overhead until the arms are nearly straight, then lower slowly back to shoulder level.',
      'Keep your core braced and avoid leaning back at the top.',
    ]),
    exercise('Seated Dumbbell Shoulder Press (تجميع كتف جالس)', 3, '10-12', 75, 'Gym', 'Dumbbell', 'photo-1506126613408-eca07ce68773', [
      'Keep a neutral spine and avoid arching the low back.',
      'Press the dumbbells up with your shoulders, not your neck.',
      'Lower with control to keep tension through the full range.',
    ]),
  ],
  Arms: [
    ...baseWorkoutDatabase.Arms.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Arms.filter((item) => item.type === 'Gym'),
    exercise('Cable Tricep Extensions (تمديدات ثلاثية الكابل)', 3, '15', 60, 'Gym', 'Dumbbell', 'photo-1581009146145-b5ef050c0020', [
      'Anchor the cable overhead with a single attachment.',
      'Keep the elbows pointed down and the upper arms stable.',
      'Extend fully and squeeze the triceps before lowering.',
    ], [
      'Stand facing the cable machine with a rope attachment overhead.',
      'Keep your elbows tucked close to your head as you extend the rope downward.',
      'Pause briefly at lockout, then lower back up slowly and repeat.',
    ]),
    exercise('Preacher Curl (بايسبس على مقعد)', 3, '10-12', 60, 'Gym', 'Dumbbell', 'photo-1581009146145-b5ef050c0020', [
      'Keep the upper arm fixed against the pad.',
      'Use a full curl and avoid swinging the torso.',
      'Pause at the top and squeeze the biceps.',
    ]),
  ],
  Abs: [
    ...baseWorkoutDatabase.Abs.filter((item) => item.type === 'Home').slice(0, 4),
    ...baseWorkoutDatabase.Abs.filter((item) => item.type === 'Gym'),
    exercise('Dead Bug (Dead Bug)', 3, '12 per side', 45, 'Home', 'Activity', 'photo-1544367567-0f2fcb009e0b', [
      'Press the lower back down and keep the ribcage quiet.',
      'Move one arm and opposite leg at a time with control.',
      'Keep the core braced through the entire rep.',
    ]),
    exercise('Pilates Core Roll-ups (لفّات بيلاتس)', 3, '15', 45, 'Home', 'Activity', 'photo-1524504388940-b1c1722653e1', [
      'Roll the spine up one vertebra at a time.',
      'Keep the neck long and the abdominals engaged.',
      'Lower slowly with control to keep the stretch meaningful.',
    ], [
      'Lie flat on your back with arms overhead and legs extended.',
      'Inhale to prepare, then exhale as you roll your spine up one segment at a time until you reach a seated position.',
      'Lower back down slowly with the abs engaged the whole time.',
    ]),
    exercise('Pilates Hundred (المئة)', 4, '100 Counts', 45, 'Home', 'Activity', 'photo-1524504388940-b1c1722653e1', [
      'Reach the arms long and keep the head neutral.',
      'Float the legs just off the floor if you can.',
      'Breathe steadily while maintaining the core brace.',
    ]),
  ],
};

export function getWorkoutDatabase(appMode: AppMode): Record<WorkoutCategory, WorkoutExercise[]> {
  return appMode === 'female' ? femaleWorkoutDatabase : baseWorkoutDatabase;
}
