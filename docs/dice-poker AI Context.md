# docs/dice-poker AI Context.md

# Dice Poker AI Context

このファイルは、現在のコードベースを読む AI エージェント向けの実装コンテキストである。内容は実コードに基づく。

詳細な危険箇所は `docs/ai-fragile-points.md` を参照。

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
    components/TurnCutIn.tsx
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
    Dice2D.tsx
    Dice3D.tsx
    DiceRollOverlay.tsx
    DiceRollPreloader.tsx
  hooks/
    useSoundEffects.ts

styles/
  globals.css

types/
  dice-box.d.ts

public/assets/dice-box/
public/sound/
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
onePairRate
```

Validation:

```txt
players:
  - trim names
  - at least 2 non-empty names
  - unique names

onePairRate:
  - string of digits only
  - not blank
  - Number(value) > 0
```

Start routes to:

```txt
/game?players=<JSON encoded string array>&onePairRate=<integer>
```

The rate input uses `type="text"` and `inputMode="numeric"` so only integer-like strings are accepted while avoiding layout issues with wider values.
The configured rate is the score for `ONE_PAIR`; all other hand scores are derived from `MULTIPLIERS`.
The score preview list is vertical and compact so the Start section can stay at the bottom of the Settings screen without requiring normal mobile scrolling.

Current score multipliers:

```txt
PINSORO: 100
FIVE_DICE: 50
FOUR_DICE: 25
STRAIGHT: 15
FULL_HOUSE: 10
THREE_DICE: 5
TWO_PAIR: 2
ONE_PAIR: 1
BUTA: 0
```

Hand names are displayed through `HAND_LABELS`:

```txt
PINSORO -> ピンゾロ
FIVE_DICE -> ５ダイス
FOUR_DICE -> ４ダイス
STRAIGHT -> ストレート
FULL_HOUSE -> フルハウス
THREE_DICE -> ３ダイス
TWO_PAIR -> ２ペア
ONE_PAIR -> １ペア
BUTA -> クソザコ
```

Settings can also receive:

```txt
/?players=<JSON encoded string array>
```

This is used by the Settings return buttons. Only player names are restored; rate remains blank by design.

The restoration is done in a client `useEffect` using `window.location.search` and a `setTimeout(..., 0)` to avoid synchronous setState inside the effect.
If the Settings page itself is reloaded, the effect detects `PerformanceNavigationTiming.type === "reload"`, removes query params with `window.history.replaceState`, and does not restore players. Navigation from other screens with `/?players=...` still restores player names.

---

# Game Initialization

`app/game/page.tsx` reads query params with `useSearchParams` inside `Suspense`.

```txt
players:
  JSON.parse
  must be string[]
  length >= 2

onePairRate:
  /^\d+$/
  Number(rate) > 0
```

Deprecated compatibility: `app/game/page.tsx` still accepts `twoPairRate` when `onePairRate` is missing.

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

To restart with the same players and same rate, replay URLs include:

```txt
restart=Date.now()
```

`app/game/page.tsx` renders:

```tsx
<GameScreen key={searchParams.toString()} ... />
```

This forces a fresh `GameScreen` instance when the query string changes.

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

Player status is derived from:

```txt
currentPlayerIndex
phase
animationState
dice[].held
```

There is no explicit per-player status field.

---

# Game Progression

Current active phase flow:

```txt
ROUND1_ROLL
  TurnCutIn displays Round 1 -> player turn
  Roll
  dice animation returns landed values
  ROLL_DICE
  SET_PHASE ROUND1_HOLD automatically

ROUND1_HOLD
  Hold allowed
  NEXT advances to next player ROUND1_ROLL
  last player NEXT advances to ROUND2_ROLL

ROUND2_ROLL
  TurnCutIn displays when round/player changes
  Roll
  dice animation returns landed values
  ROLL_DICE
  animationState WAITING_NEXT
  NEXT advances player / round

ROUND3_CONFIRM
  popup asks 3rd Roll or Skip
  popup shows current leader name/hand/score and the current player's hand/score
  3rd Roll -> SET_PHASE ROUND3_HOLD
  Skip -> ADVANCE_PHASE

ROUND3_HOLD
  Hold allowed
  Roll allowed directly
  dice animation returns landed values
  ROLL_DICE
  animationState WAITING_NEXT
  NEXT advances player / result

RESULT
  result modal asks Double Up / Play Again / Settings
```

Important: 1st Roll is the only roll that does not require NEXT after animation. 2nd and 3rd roll require NEXT after values are updated.

---

# Round / Turn Cut-In

`features/game/components/TurnCutIn.tsx` renders cut-ins.

Inputs:

```txt
roundNumber: number | null
playerName: string
triggerKey: string
```

`GameScreen` derives:

```txt
roundNumber = getRoundNumber(state.phase)
triggerKey = `${roundNumber}-${state.currentPlayerIndex}`
```

Sequence:

```txt
Round changed:
  0ms    -> set previousRoundRef and show Round n
  1875ms -> hide Round
  2175ms -> show <playerName>のターン
  4125ms -> hide Player and call onComplete(triggerKey)

Round unchanged:
  0ms    -> show <playerName>のターン
  1950ms -> hide Player and call onComplete(triggerKey)
```

The overlay is rendered as a modal dialog with `aria-modal="true"` and `pointer-events-auto`, so it blocks background controls while the cut-in is visible.

Animation CSS is global in `styles/globals.css`:

```txt
.cutin-backdrop
.cutin-blade
.cutin-blade-top
.cutin-blade-bottom
.cutin-flash
.cutin-content
.cutin-subtitle
.cutin-title
@keyframes cutin-*
```

Do not move this back to `style jsx` without verifying `npm run build`; Turbopack previously failed on the scoped style path.

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

`GameScreen` renders `DiceRollPreloader scale={15}` to preload dice-box on game screen entry.

---

# Sound Effects

Audio is centralized in:

```txt
shared/hooks/useSoundEffects.ts
```

The hook creates `Audio` instances, sets `preload = "auto"`, calls `load()`, and exposes `play(key, options)` / `stop(key)`.

Current sound mapping:

```txt
cutin              -> /sound/cutin.mp3
diceRoll           -> /sound/dice_roll.mp3
doubleUpBgm        -> /sound/doubleup_bgm.mp3
doubleUpSuccess    -> /sound/doubleup_success.mp3
doubleUpFailure    -> /sound/doubleup_failure.mp3
mainResult         -> /sound/main_result.mp3
```

Playback timing:

```txt
TurnCutIn:
  cutin plays when Round or Player cut-in step starts

GameScreen:
  diceRoll plays when Roll is clicked
  mainResult plays when the Game Complete modal first becomes visible

DoubleUpScreen:
  doubleUpBgm loops while status === SELECT
  doubleUpBgm is retried from High / Low / Roll clicks to satisfy browser autoplay policy
  doubleUpBgm stops when the roll completes or Finish is clicked
  diceRoll plays when Roll is clicked
  doubleUpSuccess plays when success popup appears
  doubleUpFailure plays when failure popup appears
```

Browser autoplay policy can still block sounds before user interaction. The implementation catches `audio.play()` failures and retries the Double Up BGM from user gestures.

---

# Cutoff Logic

There is no active automatic cutoff based on all dice being held.

`features/game/utils/hasAllHeld.ts` exists but is currently unused.

Active cutoff / branch points:

```txt
ROUND3_CONFIRM:
  popup Skip -> ADVANCE_PHASE
  popup 3rd Roll -> ROUND3_HOLD

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

# Result, Replay, and Score

Results are calculated from dice values at render time:

```txt
getPlayerResults(players)
  -> judgeHand(values)

getWinnersAndLosers(results)
  -> HAND_STRENGTH max/min
```

Score calculation:

```txt
calculateScore(hand, onePairRate)
```

`onePairRate` is the configured score for `ONE_PAIR`.

```txt
score = onePairRate * MULTIPLIERS[hand]
```

Default fallback:

```txt
BASE_SCORE = 100
default onePairRate = 100
```

Deprecated: older docs and legacy URLs describe `twoPairRate` as the score basis. Current UI writes `onePairRate`; `twoPairRate` is read only as a compatibility fallback.

Game result modal currently provides:

```txt
Winner
Loser
Winner Score
Double Up
Play Again
Settings
```

`Play Again` keeps players and rate. `Settings` keeps player names only.

---

# Double Up

Double Up uses Zustand for transient routing state.

```txt
features/double-up/store.ts
```

Current store data:

```txt
winnerIndexes
loserIndexes
score
playerNames
onePairRate
```

Route handoff:

```txt
GameScreen.startDoubleUp
  -> setDoubleUpData({
       winnerIndexes,
       loserIndexes,
       score,
       playerNames,
       onePairRate
     })
  -> router.push("/doubleup?winners=...&losers=...&score=...&players=...&onePairRate=...")
```

Direct refresh/open of `/doubleup` first reads URL query params, then falls back to default store values:

```txt
winnerIndexes: []
loserIndexes: []
score: 0
playerNames: []
onePairRate: 0
```

Deprecated: older docs saying Double Up routing is Zustand-only are no longer complete. Zustand is still written, but URL params are now also part of the handoff.

Double Up game logic:

```txt
HIGH succeeds when rolled value >= 4
LOW succeeds when rolled value <= 3
success doubles currentScore
Continue resets choice / rolledValue / isSuccess
Finish moves status to FINISHED
```

The Double Up choice buttons are a three-column mobile grid. High displays `4 / 5 / 6`; Low displays `1 / 2 / 3`.

Double Up does not render a separate top summary for main-game Winner / Loser / Score. The SELECT screen uses the same dark card shell as Final Result and shows only the current Double Up score plus High / Low / Roll controls.

Double Up roll also uses `DiceRollOverlay`; actual value comes from dice-box animation result.

For multiple dice, `DiceRollOverlay` intentionally splits rendering into one `Dice3D` canvas per die to reduce visual overlap. Single-die Double Up keeps the single `Dice3D` path.

Double Up FINISHED screen provides:

```txt
Double Up Complete card:
  Final Score
  Winner
  Loser

Play Again:
  enabled when playerNames.length >= 2 and onePairRate > 0

Settings:
  routes to /?players=...
  if no playerNames, routes to /
```

Winner / Loser are displayed inside the same Double Up Complete result card so they are read as the final Double Up outcome, not as a separate main-game result block. `isSuccess` decides whether the original winnerIndexes or loserIndexes are displayed as final winners.

The Double Up visual direction is intentionally aligned with Settings / Main Game:

```txt
page background: zinc-950
surface: zinc-950 card
accent: red borders / red gradient header / red score panel
```

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

It also contains `TurnCutIn` animation CSS. Most visual implementation uses Tailwind utility classes. Removing this import or assuming `app/globals.css` is active will break styling and cut-in animations.

`app/globals.css` currently duplicates baseline global CSS but is not imported. Treat it as deprecated / legacy until intentionally switched.

---

# Hidden Dependencies

```txt
Dice3D:
  dynamic import of @3d-dice/dice-box
  browser-only runtime
  public/assets/dice-box/
  elementId selector

DiceRollPreloader:
  hidden offscreen warm-up
  requires distinct elementId

Game progression:
  pendingRollPhaseRef
  pendingRollIndexesRef
  animationState WAITING_NEXT
  reducer ADVANCE_PHASE switch
  ROUND3_CONFIRM popup

Replay:
  restart query
  GameScreen key={searchParams.toString()}

TurnCutIn:
  triggerKey = roundNumber-currentPlayerIndex
  global .cutin-* CSS

Settings -> Game:
  query param "players"
  query param "onePairRate"
  deprecated fallback query param "twoPairRate"

Game -> DoubleUp:
  Zustand store must be set before router.push("/doubleup")
  store includes playerNames and onePairRate for replay

CSS:
  app/layout.tsx imports ../styles/globals.css

Types:
  local module declaration in types/dice-box.d.ts
```

---

# Deprecated / Temporary Implementation

Keep these documented as deprecated instead of deleting references silently:

```txt
docs/dice-poker AI Context.md originally contained TASK-008 content only
app/globals.css duplicates baseline global CSS but is not imported
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
Settings receives players query and leaves rate blank
TurnCutIn displays Round n then player turn
1st Roll -> HOLD without NEXT
2nd Roll -> NEXT required after animation
2nd Roll phase NEXT without Roll -> confirmation popup
ROUND3_CONFIRM opens decision popup
3rd final-player Skip
3rd Roll -> NEXT required after animation
3rd Roll phase NEXT without Roll -> confirmation popup
animation dice values match actual stored/displayed values
multi-dice overlay keeps dice visually separated
Result modal Double Up / Play Again / Settings
Result modal and Double Up use configured player names
Play Again restarts same players and same rate
Settings keeps player names only
Double Up HIGH/LOW animation and result value synchronization
Double Up success and failure both render popups
Double Up FINISHED Play Again / Settings
```

---

# Latest Update: Double Up Success Popup

Double Up now uses the same dark card language across SELECT, success popup, failure popup, and FINISHED.

```txt
selected choice:
  red button
  white border
  restrained red shadow
  Selected label

not selected:
  zinc card
  red border
  red text
```

After a successful roll:

```txt
status === ROLLED && isSuccess
  -> success popup
  -> rolled die is shown
  -> Current Score is shown
  -> Continue / Finish are offered
```

After a failed roll:

```txt
status === ROLLED && !isSuccess
  -> failure popup
  -> rolled die is shown
  -> Final Score is shown
  -> Finish is offered
```

`currentScore` is already doubled by `useDoubleUpGame.resolveRoll` before the success popup renders.

---

# Latest Update: Roll-Skip Confirm / Split Dice Overlay

GameScreen now asks before advancing from a rollable phase without rolling.

```txt
NEXT without Roll:
  ROUND2_ROLL -> confirmation popup
  ROUND3_HOLD -> confirmation popup
  ROUND3_ROLL -> confirmation popup

Confirm:
  dispatch ADVANCE_PHASE

Back:
  close popup and keep phase
```

`ROUND1_ROLL` is intentionally excluded because reducer `ADVANCE_PHASE` does not progress from `ROUND1_ROLL`.

`DiceRollOverlay` now has two render paths:

```txt
values.length === 1:
  one Dice3D

values.length > 1:
  one DiceRollDie per value
  each DiceRollDie owns a unique dice-box elementId
  aggregate results by original index
```

This is a UI-level overlap reduction. It does not alter `@3d-dice/dice-box` physics.

---

# Latest Update: Round / Player Cut-In Split

`TurnCutIn` no longer always displays Round -> Player.

```txt
Round changed:
  0ms    Round n
  1875ms hide
  2175ms player turn
  4125ms hide + onComplete

Round unchanged:
  0ms    player turn
  1950ms hide + onComplete
```

Implementation dependency:

```txt
triggerKey = roundNumber-currentPlayerIndex
previousRoundRef tracks the last shown round
previousRoundRef is updated when the Round cut-in starts
GameScreen gates ROUND3_CONFIRM popup on completedCutInKey === cutInTriggerKey
```

This means:

```txt
round update: Round cut-in -> Player cut-in
player switch inside same round: Player cut-in only
```

---

# Latest Update: Current Hands / Responsive DiceBox

Main Game no longer renders the old inline `Result` section. Instead, `GameScreen` always renders `Current Hands` near the bottom of the game screen.

```txt
Current Hands:
  player name
  dice values after the player's first roll
  current hand
  score

Before first roll:
  ROLL前
```

The finish popup title is `Game Complete`; it shows Winner, Loser, and Winner Score. The old explanatory text about checking the bottom list has been removed.

The main Roll button display text is `サイコロを振る`. Roll and Next share the same minimum width and a slightly larger gap.

Hand priority still comes from `judgeHand` order. Stronger hands are checked before weaker hands.

DiceBox responsiveness:

```txt
Game Dice3D canvas:
  h-[260px] sm:h-[420px] lg:h-[680px]

Double Up Dice3D canvas:
  h-[300px] sm:h-[480px] lg:h-[720px]

Multi-dice DiceRollOverlay:
  mobile: one column, wider per-die physical space
  tablet/desktop: 2-3 columns
```

`Dice3D` temporarily limits `requestAnimationFrame` to roughly 30fps while Dice3D instances are mounted. This is a local wrapper-level workaround because the current dice-box package does not expose a public FPS option.
