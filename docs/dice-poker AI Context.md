# docs/dice-poker AI Context.md

# Dice Poker AI Context

このファイルは、現在のコードベースを読む AI エージェント向けの実装コンテキストである。内容は実コードに基づく。

関連する詳細な危険箇所は `docs/ai-fragile-points.md` を参照。

---

# Current App Structure

```txt
app/
  layout.tsx
  page.tsx
  settings/page.tsx
  game/page.tsx
  doubleup/page.tsx

features/
  game/
    components/GameScreen.tsx
    hooks/useGameEngine.ts
    reducer/
    utils/
    constants/
    types/
  double-up/
    components/DoubleUpScreen.tsx
    hooks/useDoubleUpGame.ts
    store.ts
    types.ts

shared/
  components/Dice/

styles/
  globals.css

types/
  dice-box.d.ts

public/assets/dice-box/
```

---

# Routing

Current routes:

```txt
/          -> SettingsPage
/settings  -> SettingsPage
/game      -> GameScreen via query params
/doubleup  -> DoubleUpScreen
```

`app/page.tsx` imports and renders `app/settings/page.tsx`, so settings is the main page.

Older references to `/double-up` are deprecated. Current route is `/doubleup`.

---

# Settings Flow

`app/settings/page.tsx` is a client component.

It manages:

```txt
players
backupPlayers
playerCount
dialogMode
errorMessage
twoPairRate
```

Validation:

```txt
players:
  - trim names
  - at least 2 non-empty names
  - unique names

twoPairRate:
  - string of digits only
  - not blank
  - Number(value) > 0
```

Start routes to:

```txt
/game?players=<JSON encoded string array>&twoPairRate=<integer>
```

The rate input uses `type="text"` and `inputMode="numeric"` so only integer-like strings are accepted while avoiding layout issues with wider values.

---

# Game Initialization

`app/game/page.tsx` reads query params with `useSearchParams` inside `Suspense`.

```txt
players:
  JSON.parse
  must be string[]
  length >= 2

twoPairRate:
  /^\d+$/
  Number(rate) > 0
```

Invalid or missing params fall back to defaults inside the game layer.

`GameScreen` passes `playerNames` into:

```ts
useGameEngine(playerNames)
```

`useGameEngine` uses:

```ts
useReducer(
  gameReducer,
  playerNames,
  createGameInitialState
)
```

This means initial player names are captured by the reducer initializer. Later prop changes do not reset state.

---

# State Management

Main game state is reducer-based.

```txt
features/game/hooks/useGameEngine.ts
features/game/reducer/gameReducer.ts
features/game/reducer/gameInitialState.ts
```

State shape:

```txt
phase
currentPlayerIndex
animationState
players[]
```

Animation state:

```txt
IDLE
ROLLING
WAITING_NEXT
```

Player shape currently includes:

```txt
name
dice[]
hand
point
```

`hand` and `point` are initialized but not actively used for result calculation. Results are derived from dice values with `getPlayerResults(players)`.

---

# Game Progression

Current active phase flow:

```txt
ROUND1_ROLL
  Roll
  dice animation returns landed values
  ROLL_DICE
  SET_PHASE ROUND1_HOLD automatically

ROUND1_HOLD
  Hold allowed
  NEXT advances to next player ROUND1_ROLL
  last player NEXT advances to ROUND2_ROLL

ROUND2_ROLL
  Roll
  dice animation returns landed values
  ROLL_DICE
  animationState WAITING_NEXT
  NEXT advances player / round

ROUND3_CONFIRM
  3rd Roll button -> SET_PHASE ROUND3_HOLD
  Skip button -> ADVANCE_PHASE

ROUND3_HOLD
  Hold allowed
  Roll allowed directly
  dice animation returns landed values
  ROLL_DICE
  animationState WAITING_NEXT
  NEXT advances player / result

RESULT
  result modal asks Double Up or Finish
```

Important: 1st Roll is the only roll that does not require NEXT after animation. 2nd and 3rd roll require NEXT after values are updated.

---

# Phase Types and Legacy Values

`features/game/types/phase.ts` currently includes:

```txt
ROUND1_ROLL
ROUND1_HOLD
ROUND2_ROLL
ROUND3_CONFIRM
ROUND3_HOLD
ROUND3_ROLL
JUDGE
ADVANCE_PHASE
RESULT
```

Active UI/reducer flow uses `ROUND3_HOLD` as the 3rd-roll phase. `ROUND3_ROLL`, `JUDGE`, and phase value `ADVANCE_PHASE` are legacy / currently inactive type values.

`GameAction` also contains `NEXT_PLAYER`, but current UI does not dispatch it. Normal progression uses `ADVANCE_PHASE` plus some explicit `SET_PHASE` calls in `GameScreen`.

---

# Roll / Animation Dynamic Behavior

Roll values are synchronized with dice-box animation.

Current sequence:

```txt
GameScreen.handleRoll
  -> animationState ROLLING
  -> store phase in pendingRollPhaseRef
  -> store unheld dice indexes in pendingRollIndexesRef
  -> open DiceRollOverlay with placeholder values array

Dice3D
  -> dynamic import @3d-dice/dice-box
  -> roll qty dice
  -> receive landed values from dice-box

GameScreen.completeRoll(rolledValues)
  -> map rolledValues back to pendingRollIndexesRef
  -> dispatch ROLL_DICE with full 5 dice values
  -> update phase / animationState
```

Do not generate random values separately in reducer or UI. The actual roll result must come from dice-box.

Held dice are preserved by index. Only unheld dice are replaced by the returned roll values.

---

# Cutoff Logic

There is no active automatic cutoff based on all dice being held.

`features/game/utils/hasAllHeld.ts` exists but is currently unused.

Active cutoff / branch points:

```txt
ROUND3_CONFIRM:
  Skip -> ADVANCE_PHASE
  3rd Roll -> ROUND3_HOLD

RESULT:
  Double Up allowed only when not tie and both winners / losers exist
```

Tie detection in `GameScreen` is derived from result arrays:

```txt
state.phase === RESULT
winners.length === results.length
losers.length === results.length
```

---

# Result and Score

Results are calculated from dice values at render time:

```txt
getPlayerResults(players)
  -> judgeHand(values)

getWinnersAndLosers(results)
  -> HAND_STRENGTH max/min
```

Score calculation:

```txt
calculateScore(hand, twoPairRate)
```

`twoPairRate` is the configured score for `TWO_PAIR`.

```txt
baseScore = twoPairRate / 2
score = baseScore * MULTIPLIERS[hand]
```

Default fallback:

```txt
BASE_SCORE = 100
default twoPairRate = 200
```

Because settings only require integer input, odd `twoPairRate` values can produce fractional scores for other hands.

---

# Double Up

Double Up uses Zustand for transient routing state.

```txt
features/double-up/store.ts
```

Data written before route push:

```txt
winnerIndexes
loserIndexes
score
```

Route handoff:

```txt
GameScreen.startDoubleUp
  -> setDoubleUpData(...)
  -> router.push("/doubleup")
```

Direct refresh/open of `/doubleup` uses default store values:

```txt
winnerIndexes: []
loserIndexes: []
score: 0
```

Double Up game logic:

```txt
HIGH succeeds when rolled value >= 4
LOW succeeds when rolled value <= 3
success doubles currentScore
Continue resets choice / rolledValue / isSuccess
Finish moves status to FINISHED
```

Double Up roll also uses `DiceRollOverlay`; actual value comes from dice-box animation result.

---

# CSS Import Dependency

Global CSS is imported in:

```txt
app/layout.tsx
```

Current import:

```ts
import "../styles/globals.css";
```

`styles/globals.css` contains:

```css
@import "tailwindcss";
```

Most visual implementation uses Tailwind utility classes. Removing this import or assuming `app/globals.css` is active will break styling.

`app/globals.css` currently duplicates the global CSS but is not imported. Treat it as deprecated / legacy until intentionally switched.

---

# Hidden Dependencies

```txt
Dice3D:
  dynamic import of @3d-dice/dice-box
  browser-only runtime
  public/assets/dice-box/
  "#dice-box" selector

Game progression:
  pendingRollPhaseRef
  pendingRollIndexesRef
  animationState WAITING_NEXT
  reducer ADVANCE_PHASE switch

Settings -> Game:
  query param "players"
  query param "twoPairRate"

Game -> DoubleUp:
  Zustand store must be set before router.push("/doubleup")

CSS:
  app/layout.tsx imports ../styles/globals.css

Types:
  local module declaration in types/dice-box.d.ts
```

---

# Deprecated / Temporary Implementation

Keep these documented as deprecated instead of deleting references silently:

```txt
docs/dice-poker AI Context.md previously contained TASK-008 content only
app/globals.css duplicates global CSS but is not imported
shared/components/Dice/index.tsx exports Dice3D as Dice but current code imports Dice2D directly
features/game/utils/hasAllHeld.ts is unused
GamePhase includes ROUND3_ROLL / JUDGE / ADVANCE_PHASE but current UI flow does not use them as active phases
GameAction NEXT_PLAYER is unused in current UI
GamePlayer.hand and GamePlayer.point are initialized but not used for result calculation
framer-motion and react-icons are present in package.json but not imported by current source
```

---

# Validation Commands

Recommended after implementation changes:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual verification targets:

```txt
Settings validation and mobile layout
1st Roll -> HOLD without NEXT
2nd Roll -> NEXT required after animation
3rd final-player Skip
3rd Roll -> NEXT required after animation
animation dice values match actual stored/displayed values
Result modal Double Up / Finish
Double Up HIGH/LOW animation and result value synchronization
```
