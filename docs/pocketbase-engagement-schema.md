# PulseFit engagement schema

The current Express API adapter keeps friend requests in memory so the web app can run against the existing local server. For production, create these PocketBase collections and point the adapter at PocketBase.

## `users`

Use the existing auth collection if it already exists. Add these fields:

| Field | Type | Notes |
| --- | --- | --- |
| `username` | text, unique | Searchable public handle |
| `firstName` | text | Public display data |
| `lastName` | text | Public display data |
| `gender` | select | `male`, `female` |
| `weight` | number | Kilograms |
| `height` | number | Centimeters |
| `age` | number | Years |
| `goal` | select | `cutting`, `bulking`, `maintenance` |
| `streakDays` | number | Current consecutive activity days |
| `streakLastDate` | date | Last day that counted toward the streak |
| `points` | number | Leaderboard points |
| `badges` | json | Earned milestone badge IDs |
| `completedWorkouts` | number | Workout completion count |
| `steps` | number | Latest synced step count |
| `waterMlToday` | number | Local-day water total |
| `waterGoalMl` | number | Derived from weight, normally `weight * 35` |
| `streak_frozen` | boolean | Female streak-freeze currently active |
| `streak_frozen_at` | date | When the current freeze began |
| `streak_freeze_duration` | number | Freeze duration in days |

Recommended list rule: authenticated users can read only public profile fields. Update rules should allow a user to update only their own record.

## `friend_requests`

| Field | Type | Notes |
| --- | --- | --- |
| `fromUser` | relation -> users | Request sender |
| `toUser` | relation -> users | Request recipient |
| `status` | select | `pending`, `accepted`, `declined`, `blocked` |
| `created` | date | PocketBase system field |
| `respondedAt` | date | Optional |

Create a unique compound constraint in application logic for `(fromUser, toUser)` while status is `pending`. List rule should expose a row only when the authenticated user is `fromUser` or `toUser`. Update rule should allow only `toUser` to accept, decline, or block.

## `daily_activity`

| Field | Type | Notes |
| --- | --- | --- |
| `user` | relation -> users | Owner |
| `activityDate` | date | Local calendar date stored in UTC-safe ISO format |
| `mealsLogged` | number | Count for the day |
| `workoutsCompleted` | number | Count for the day |
| `waterMl` | number | Total water logged |
| `steps` | number | Synced steps |
| `activeCalories` | number | Synced activity calories |
| `pointsEarned` | number | Daily reward total |

Add a unique `(user, activityDate)` upsert in the API. A meal log or workout completion should upsert this record, update `users.streakLastDate`, and award points exactly once for the event.

## `buddy_challenges`

| Field | Type | Notes |
| --- | --- | --- |
| `createdBy` | relation -> users | Challenge owner |
| `participant` | relation -> users | Friend participant |
| `metric` | select | `steps`, `workouts`, `streak`, `water` |
| `startsOn` | date | Challenge start |
| `endsOn` | date | Challenge end |
| `status` | select | `invited`, `active`, `completed`, `cancelled` |
| `winner` | relation -> users | Optional winner |

Only participants should be able to read a challenge. Updates should be limited to challenge status and winner calculation on the server.

## Streak and points rules

1. Normalize activity dates to the user’s local day before writing.
2. If the previous activity date is yesterday, increment `streakDays`; if it is today, do nothing; otherwise reset to `1`.
3. Award points server-side so leaderboard values cannot be inflated by client edits.
4. Suggested rewards: meal log `+5`, workout completion `+25`, water goal `+10`, seven-day streak `+100`.
5. The client remains usable offline by writing the same payload to local storage and retrying the sync when the browser or Capacitor network becomes online.

## Capacitor recommendations

- `@capacitor/local-notifications` for scheduled native hydration reminders.
- `@capacitor/preferences` for small settings and a sync cursor.
- IndexedDB for larger daily activity queues and food/workout caches.
- `@capacitor/network` to trigger the sync queue on native `networkStatusChange` events.

The current frontend already uses local storage for critical cached state and browser online/offline events. Replace the API adapter’s in-memory friend request map with PocketBase create/list/update calls when these collections are created.

## Public IDs and notifications

Add `publicUserId` as a unique text field on `users`, using the `#PF-xxxxx` format. Add a `notifications` collection with `user`, `title`, `message`, `type`, `read`, and `createdAt` fields. The server should enforce that only the owner can read or mark their notifications, while admin-created direct messages and broadcasts are written server-side.

Add `governorate` as an optional text field on `users`. Existing records should remain `null` or display as `غير محددة`. Admin analytics groups this field and calculates each group as `count / total users * 100`, rounded to two decimal places.

## Workout check-ins and PRs

Create a `workout_check_ins` collection with `user` (relation), `note` (text, max 160), and `createdAt` (date). Enforce one record per user in any rolling 24-hour window server-side. A successful check-in is the only client action that increments the daily workout streak.

Create an `exercise_prs` collection with `user` (relation), `exerciseName` (text), `value` (text), and `updatedAt` (date). Use a unique compound key for `(user, exerciseName)` and upsert the value whenever the user saves a new personal record.

Create a `water_logs` collection with `user` (relation), `amountMl` (number), `dayKey` (text), and `createdAt` (date). The client stores a bounded local history for offline use and queues each water event; the sync endpoint should upsert/append these records and use `dayKey` to calculate the current daily total.

Create a `body_measurements` collection with `user` (relation), `date` (date), `weight`, `waist`, `chest`, `arms`, `bodyFatPercentage`, `muscleMass`, `photo` (file), and `notes`. In production, upload progress photos as PocketBase files rather than keeping data URLs in the record; the current local adapter accepts a bounded data URL while offline and is ready to be replaced by the file upload call.

## Hourly reporting

The local server sends separate reports every hour using `PULSEFIT_BOYS_BOT_TOKEN`, `PULSEFIT_GIRLS_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`. The girls report includes the number of active freezes and, for each female user, the freeze start time, elapsed hours, and estimated remaining days. The production PocketBase reporter should query users by `gender`, `created`, `updated`, and the three freeze fields above, then aggregate `daily_activity`, `subscription_requests`, and audit records for the previous hour.

The current local server also exposes `POST /api/sync/activity`. It accepts idempotent `meal`, `water`, and `workout` events from the client queue. In production, map that endpoint to `daily_activity` upserts and perform point/streak awarding server-side.
