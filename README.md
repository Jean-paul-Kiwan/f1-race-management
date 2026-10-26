# F1 Race Management

**Source archived; complete run not verified.** Owner-reported Lebanese University project; exact program/course not established here. Original archive snapshot with Express/Mongoose/MongoDB backend, React/Vite web client and Flutter client source.

Code implements teams/drivers/races/results, filtering/populated relationships and a team-points leaderboard including teams with no results. Original .env, dependencies/caches, demo video, real-roster/destructive seed and generated Flutter platform material are excluded. No private roster or assets supplied.

Manifest commands, **untested for this source snapshot**: backend `npm ci`, then `npm start`; frontend `npm ci`, then `npm run dev -- --host 127.0.0.1`. Use an isolated disposable local MongoDB and copy backend/.env.example to an ignored .env. The original backend binding and unauthenticated mutation endpoints require care: do not expose this service or deploy it publicly. No seed is included. Flutter lib/pubspec source is archived; platform scaffolding/setup needs restoration and is not tested.

A separate recovery copy started Vite and served modules over HTTP, but its backend was blocked by missing MongoDB; no fictional end-to-end flow or browser rendering was verified. Those recovery safeguards are not claimed for this original-code snapshot. No functional deployment, screenshot or passing original demo claimed.
