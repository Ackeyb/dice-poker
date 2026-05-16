# docs/ai-fragile-points.md

# Fragile / Dangerous Areas

このドキュメントは、現在の実コードベースを前提に、AI エージェントが壊しやすい箇所、hidden dependency、legacy / temporary implementation を整理する。

確認対象:

```txt
app/
features/
shared/
styles/
types/
public/assets/dice-box/
```

---

# 1. Dice3D / dice-box Integration

## Severity

CRITICAL

## Files

```txt
shared/components/Dice/Dice3D.tsx
shared/components/Dice/DiceRollOverlay.tsx
shared/components/Dice/DiceRollPreloader.tsx
types/dice-box.d.ts
public/assets/dice-box/
```

## Why Fragile

`@3d-dice/dice-box` は browser / WebGL / canvas / physics runtime 前提で、SSR 安全ではない。

`Dice3D.tsx` は `useEffect` 内で dynamic import している。

```ts
const diceBoxModule =
  await import(
    "@3d-dice/dice-box"
  );
```

module scope で static import すると SSR / hydration / build で壊れる可能性が高い。

## Hidden Dependency

`DiceBox` constructor は以下に依存している。

```txt
selector: `#${elementId}`
assetPath: "/assets/dice-box/"
public/assets/dice-box/ammo/
public/assets/dice-box/themes/
window / document / canvas / WebGL
```

`public/assets/dice-box/` はコードから直接 import されないが runtime 必須。cleanup で削除禁止。

## Current Dynamic Behavior

現在は、渡された `values` の数だけ dice-box に `qty` を渡し、物理演算の着地結果を `onRollComplete(values)` で親へ返す。

```txt
GameScreen / DoubleUpScreen
  -> DiceRollOverlay(values = dice count placeholder)
  -> Dice3D rolls qty dice
  -> dice-box returned values
  -> parent state is updated
```

重要: `values` は最終出目ではなく「振るダイス数」を表す placeholder として使われる。実際の出目は `box.roll(...)` の戻り値。

## Preload Behavior

`GameScreen` は `DiceRollPreloader` を常時 render して、ゲーム画面表示時に dice-box を画面外で一度初期化する。

```txt
DiceRollPreloader
  -> elementId="dice-box-preload"
  -> values={[1]}
  -> scale={15}
  -> onRollComplete -> setReady(true)
  -> ready後は null
```

`Dice3D` の `elementId` prop は、通常 overlay の `dice-box` と preload 用 `dice-box-preload` の DOM id 衝突を避けるために必要。

## Required Safeguards

- `use client` を維持する
- dynamic import を維持する
- `assetPath: "/assets/dice-box/"` を維持する
- `public/assets/dice-box/` を削除しない
- `elementId` を削除しない
- `DiceRollPreloader` を「見えないから不要」と判断して削除しない
- `onRollComplete(values: number[])` の値を親側の結果更新に使う
- `container.innerHTML = ""` と `box.clear?.()` の cleanup を残す

## Deprecated Notes From Older Docs

以前の docs では「UI が乱数を生成して Overlay が同一 values を描画する」と説明していたが、現在は deprecated。現在の single source of truth は dice-box の roll result。

---

# 2. DiceRollOverlay Timing

## Severity

HIGH

## Files

```txt
shared/components/Dice/DiceRollOverlay.tsx
features/game/components/GameScreen.tsx
features/double-up/components/DoubleUpScreen.tsx
```

## Why Fragile

Overlay は単なる表示ではなく、phase progression のタイミング制御点になっている。

```txt
ROLL button
  -> animationState = ROLLING
  -> DiceRollOverlay open
  -> Dice3D roll complete
  -> 1500ms delay
  -> onComplete(rolledValues)
  -> game / double-up state update
```

`DiceRollOverlay` の `setTimeout(..., 1500)` は、出目が見えた後に状態更新するための意図的な delay。不要そうに見えても削除しない。

## Current Sizes

```txt
Game overlay:
  diceScale={15}
  diceClassName="h-[900px] max-h-[85vh]"
  panelClassName="max-w-6xl"

Double Up overlay:
  diceScale={20}
  diceClassName="h-[1040px] max-h-[85vh]"
  panelClassName="max-w-6xl"
```

サイズ指定は user-facing requirement。安易に default scale に戻さない。

## Required Safeguards

- `open === false` のときだけ `return null`
- `onComplete` の引数 `values: number[]` を保持する
- timer cleanup を残す
- overlay close より前に roll result を捨てない

---

# 3. Game State Management

## Severity

CRITICAL

## Files

```txt
features/game/hooks/useGameEngine.ts
features/game/reducer/gameReducer.ts
features/game/reducer/gameInitialState.ts
features/game/types/game.ts
features/game/types/phase.ts
features/game/types/reducer.ts
app/game/page.tsx
```

## Current State Shape

`useGameEngine(playerNames?)` は `useReducer` と lazy initializer `createGameInitialState` を使う。

```txt
GameState
  phase
  currentPlayerIndex
  animationState
  players[]
```

`players[]` は settings / query params 由来の名前で初期化される。指定がない場合は `["Player 1", "Player 2"]`。

## Hidden Dependency

`useReducer(gameReducer, playerNames, createGameInitialState)` の lazy initializer により、初回 render 時の `playerNames` だけが初期化に使われる。

同じ設定で再プレイすると通常は同じ URL / props になり state が残りやすい。そのため現在は以下が入っている。

```txt
buildGameUrl(...):
  adds restart=Date.now()

app/game/page.tsx:
  <GameScreen key={searchParams.toString()} ... />
```

`restart` query と `key` は、同じプレイヤー / 同じレートで最初からやり直すための hidden dependency。

## Player Status Handling

現在、player の進行状態は明示的な status field ではなく、以下から派生している。

```txt
currentPlayerIndex
phase
animationState
dice[].held
```

`GamePlayer` には `hand` と `point` があるが、現在の result 表示では `getPlayerResults(players)` が毎回 dice values から `judgeHand` している。`hand` / `point` は legacy / temporary field として扱う。

## Required Safeguards

- reducer に side effect を入れない
- `currentPlayerIndex` と `phase` の coupling を崩さない
- player status を安易に新規 field 化しない
- `restart` query と `GameScreen key` を削除しない
- lazy initializer の挙動を理解せずに prop-driven reset を入れない

---

# 4. Game Progression / Phase Logic

## Severity

CRITICAL

## Files

```txt
features/game/components/GameScreen.tsx
features/game/reducer/gameReducer.ts
features/game/types/phase.ts
features/game/components/TurnCutIn.tsx
```

## Current Active Flow

現在の実UI上の flow:

```txt
ROUND1_ROLL
  TurnCutIn: Round 1 -> player turn
  Roll
  animation result applies
  automatically SET_PHASE -> ROUND1_HOLD

ROUND1_HOLD
  Hold allowed
  NEXT -> next player ROUND1_ROLL
  last player NEXT -> ROUND2_ROLL

ROUND2_ROLL
  TurnCutIn fires when round/player key changes
  Roll
  animation result applies
  animationState -> WAITING_NEXT
  NEXT -> next player ROUND2_ROLL
  last player NEXT -> ROUND3_CONFIRM

ROUND3_CONFIRM
  central popup asks 3rd Roll or Skip
  central popup shows current leader name/hand and current player's hand
  3rd Roll -> SET_PHASE ROUND3_HOLD
  Skip -> ADVANCE_PHASE

ROUND3_HOLD
  Hold allowed
  Roll is also allowed directly in this phase
  animation result applies
  animationState -> WAITING_NEXT
  NEXT -> next player ROUND3_CONFIRM
  last player NEXT -> RESULT

RESULT
  modal shows Double Up / Play Again / Settings
```

## 3rd Roll Decision Popup

`ROUND3_CONFIRM` は画面内 inline buttons ではなく、GameScreen の central popup で `3rd Roll` / `Skip` を選ばせる。

この popup は `state.phase` と `completedCutInKey === cutInTriggerKey` に依存して表示される。カットイン終了前に出してはいけない。

```txt
isRound3Confirm =
  state.phase === "ROUND3_CONFIRM" &&
  completedCutInKey === cutInTriggerKey
```

The popup derives current leader data from `getWinnersAndLosers(results)` and current player hand from `getPlayerResults(state.players)`. It also displays both scores using `calculateScore(..., effectiveOnePairRate)`.

## Hidden Dependency

`ROUND3_HOLD` is both hold phase and roll phase. `gameReducer` allows `ROLL_DICE` in `ROUND3_HOLD`.

```ts
state.phase === "ROUND3_HOLD"
```

This is intentional. Do not split it into a new `ROUND3_ROLL` path unless the UI, reducer, and NEXT handling are changed together.

## Deprecated / Legacy Phases

`features/game/types/phase.ts` still includes:

```txt
ROUND3_ROLL
JUDGE
ADVANCE_PHASE
```

Current UI does not set `ROUND3_ROLL`. `JUDGE` and `ADVANCE_PHASE` are not active phases in current reducer transitions. Treat them as legacy type values, not as reliable runtime phases.

## Deprecated Actions

`NEXT_PLAYER` exists in `GameAction` and reducer, but current UI does not dispatch it. It increments `currentPlayerIndex` without bounds checks, so do not use it for normal progression.

---

# 5. TurnCutIn / CSS Animation

## Severity

HIGH

## Files

```txt
features/game/components/TurnCutIn.tsx
features/game/components/GameScreen.tsx
styles/globals.css
```

## Current Behavior

`TurnCutIn` displays:

```txt
Round n
<playerName>のターン
```

It is triggered by:

```txt
roundNumber = getRoundNumber(state.phase)
triggerKey = `${roundNumber}-${state.currentPlayerIndex}`
```

Sequence:

```txt
Round changed:
  0ms    -> step ROUND
  1875ms -> step null
  2175ms -> step PLAYER
  4125ms -> step null + onComplete

Round unchanged:
  0ms    -> step PLAYER
  1950ms -> step null + onComplete
```

The overlay is a modal dialog with `aria-modal="true"` and `pointer-events-auto`; it intentionally blocks gameplay controls while visible.

## Hidden Dependency

Animation classes are global CSS in `styles/globals.css`, not component-scoped CSS.

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

These class names are referenced by `TurnCutIn.tsx`. Renaming or deleting CSS breaks the cut-in.

## Fragile Build Note

`style jsx` was avoided because Turbopack failed on the scoped style transform in this codebase. Keep the cut-in CSS in global CSS unless build behavior is reverified.

---

# 6. Animation Lock / NEXT Gating

## Severity

HIGH

## Files

```txt
features/game/components/GameScreen.tsx
features/game/types/game.ts
```

## Current Behavior

`animationState` controls button availability.

```txt
IDLE
ROLLING
WAITING_NEXT
```

- `ROLLING`: Roll / Hold / Next interactions are blocked.
- `WAITING_NEXT`: Roll and Hold are blocked; user must press NEXT.
- Exception: 1st Roll does not enter `WAITING_NEXT`; it applies values and moves directly to `ROUND1_HOLD`.

## Hidden Dependency

`pendingRollPhaseRef` stores the phase at the moment Roll was clicked. `handleNext` depends on that ref to decide whether `ADVANCE_PHASE` should run after waiting.

`pendingRollIndexesRef` maps dice-box returned values back onto the actual dice indexes. Removing it causes held dice and partial rolls to desync.

## Required Safeguards

- Do not replace refs with render state unless timing is reworked carefully
- Do not update dice values before animation result returns
- Do not auto-advance 2nd / 3rd roll after animation
- Keep 1st roll auto transition to `ROUND1_HOLD`

---

# 7. Roll Result Synchronization

## Severity

CRITICAL

## Files

```txt
features/game/components/GameScreen.tsx
features/game/reducer/gameReducer.ts
features/double-up/components/DoubleUpScreen.tsx
shared/components/Dice/Dice3D.tsx
```

## Current Correct Architecture

```txt
Dice3D
  -> receives dice count placeholder
  -> calls dice-box roll(qty)
  -> receives actual landed values

GameScreen
  -> maps landed values to unheld dice indexes
  -> dispatches ROLL_DICE with full 5 values

gameReducer
  -> updates only non-held dice
```

Double Up uses the same `DiceRollOverlay`; `values[0]` from dice-box is passed to `resolveRoll(value)`.

## Dangerous Refactor

Do not reintroduce `Math.random()` in:

```txt
GameScreen
DoubleUpScreen
gameReducer
render paths
```

The visible animation value and actual state value must come from the same dice-box roll result.

---

# 8. Cutoff Logic

## Severity

HIGH

## Files

```txt
features/game/components/GameScreen.tsx
features/game/reducer/gameReducer.ts
features/game/utils/hasAllHeld.ts
```

## Current Behavior

There is no automatic cutoff based on all dice held. The existing `hasAllHeld.ts` helper is not used by current code.

The only active cutoff / branch behavior is:

```txt
ROUND3_CONFIRM
  popup 3rd Roll -> SET_PHASE ROUND3_HOLD
  popup Skip -> ADVANCE_PHASE
```

Result actions are gated:

```txt
Double Up enabled only when:
  phase === RESULT
  not tie
  winners.length > 0
  losers.length > 0

Play Again:
  always available in Game result modal
  available in DoubleUp FINISHED only when playerNames.length >= 2 and onePairRate > 0

Settings:
  passes player names only
```

## Legacy / Temporary

`hasAllHeld.ts` is a legacy unused helper. Do not document it as active cutoff behavior. If reintroduced, update reducer and UI gating together.

---

# 9. Result / Double Up / Replay Routing State

## Severity

HIGH

## Files

```txt
features/game/components/GameScreen.tsx
features/double-up/store.ts
features/double-up/components/DoubleUpScreen.tsx
features/double-up/hooks/useDoubleUpGame.ts
app/doubleup/page.tsx
app/settings/page.tsx
app/game/page.tsx
```

## Hidden Dependency

Deprecated: Double Up data used to be transient Zustand state only. Current code still writes Zustand, but also routes to `/doubleup` with URL params for winners, losers, score, playerNames, and onePairRate.

Current store fields:

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

If `/doubleup` is opened directly or refreshed, `DoubleUpScreen` first tries URL query params, then falls back to store defaults:

```txt
winnerIndexes: []
loserIndexes: []
score: 0
playerNames: []
onePairRate: 0
```

The Result popup and Double Up screen resolve display names through `playerNames[index] ?? Player n`.

## Replay / Settings Buttons

Game result modal:

```txt
Winner
Loser
Winner Score
Double Up
Play Again -> /game?players=...&onePairRate=...&restart=Date.now()
Settings   -> /?players=...
```

DoubleUp FINISHED screen:

```txt
Double Up Complete card:
  Final Score
  Winner
  Loser
Play Again -> /game?players=...&onePairRate=...&restart=Date.now()
Settings   -> /?players=...
```

Winner / Loser are intentionally nested inside the Double Up Complete result card. This keeps them attached to the final Double Up outcome instead of looking like a separate main-game result section. `isSuccess` swaps the original winnerIndexes / loserIndexes for the final outcome.

Do not reintroduce the old top-level Winner / Loser / Score summary on the Double Up page. It duplicated information and made the final result ambiguous.

Double Up SELECT, success popup, failure popup, and FINISHED should share the same dark `zinc-950` card language with red accents, matching Settings and Main Game.

Settings route intentionally carries player information only. Rate is not inherited and remains blank.

## Route Name

Current route is:

```txt
/doubleup
```

Older docs saying `/double-up` are deprecated.

## Double Up Rules

```txt
choice HIGH -> success if value >= 4
choice LOW  -> success if value <= 3
success     -> currentScore doubles
failure     -> currentScore stays as-is, winner/loser display swaps via isSuccess
```

High / Low choice buttons intentionally include range captions:

```txt
High: 4 / 5 / 6
Low:  1 / 2 / 3
```

The SELECT controls use a three-column grid so High, Low, and Roll fit on one mobile row.

---

# 10. Settings / Query Param Dependency

## Severity

HIGH

## Files

```txt
app/page.tsx
app/settings/page.tsx
app/game/page.tsx
features/game/components/GameScreen.tsx
features/game/utils/calculateScore.ts
```

## Current Behavior

`/` renders `SettingsPage`.

```ts
import SettingsPage from "./settings/page";
```

`SettingsPage` validates:

```txt
players: at least 2, non-empty, unique
onePairRate: integer string, > 0
```

Then it routes to:

```txt
/game?players=<JSON encoded string array>&onePairRate=<integer>
```

`app/game/page.tsx` parses these query params and passes them to `GameScreen`.
It still accepts deprecated `twoPairRate` as a fallback when `onePairRate` is missing.

Settings also reads optional `players` query from `window.location.search` in a client effect and restores only player names. It does not restore rate.

On browser reload, Settings detects `PerformanceNavigationTiming.type === "reload"`, removes query params with `window.history.replaceState`, and skips player restoration. Do not remove this without rechecking the requirement that reloading Settings clears carried player data while normal navigation from other screens still restores it.

## Hidden Dependency

`calculateScore(hand, onePairRate)` treats the configured `onePairRate` as the value for `ONE_PAIR`:

```txt
score = onePairRate * MULTIPLIERS[hand]
```

Settings validation requires integer input and `> 0`. Because `ONE_PAIR` is multiplier 1, derived scores remain integer for integer input.

Current multiplier values:

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

Hand display labels are centralized in `features/game/constants/handLabels.ts`. Keep internal `HandRank` ids stable and translate at render time.

## Deprecated

Older docs that describe fixed base score only are deprecated. Default still exists as fallback:

```txt
BASE_SCORE = 100
default onePairRate = 100
```

But normal flow gets the rate from settings.

Deprecated: older docs and legacy URLs describe `twoPairRate` as the score basis. Current UI writes `onePairRate`; `twoPairRate` is read only as a compatibility fallback.

---

# 11. CSS Import Dependency

## Severity

HIGH

## Files

```txt
app/layout.tsx
styles/globals.css
app/globals.css
features/game/components/TurnCutIn.tsx
```

## Current Behavior

`app/layout.tsx` imports:

```ts
import "../styles/globals.css";
```

`styles/globals.css` contains:

```css
@import "tailwindcss";
```

It also contains the `.cutin-*` classes and `@keyframes cutin-*` used by `TurnCutIn`.

Removing or moving this import breaks:

```txt
Tailwind utility styling
TurnCutIn animation
global body colors
```

## Legacy / Deprecated

`app/globals.css` exists and currently duplicates the baseline CSS content, but it is not imported by `app/layout.tsx`. Treat it as legacy / unused until the layout import is intentionally changed.

---

# 12. Shared Component Boundary

## Severity

MEDIUM

## Files

```txt
shared/components/Dice/
```

## Current Behavior

`shared/components/Dice/Dice2D.tsx` is used for visible static dice in Game and Double Up.

`shared/components/Dice/Dice3D.tsx` is used through `DiceRollOverlay`.

`shared/components/Dice/DiceRollPreloader.tsx` is a shared preload helper used by `GameScreen`.

## Legacy / Deprecated

`shared/components/Dice/index.tsx` exports:

```ts
export { Dice3D as Dice } from "./Dice3D";
```

Current feature code imports `Dice2D` directly and does not use this barrel export. Treat the barrel export as legacy and potentially misleading.

## Boundary Rule

Do not import game reducer, Zustand store, router, or feature-specific rules into `shared/components`. Shared dice components should remain generic UI / animation components.

---

# 13. Type Shim / Temporary Implementation

## Severity

MEDIUM

## Files

```txt
types/dice-box.d.ts
```

## Why Exists

The project uses a local declaration for `@3d-dice/dice-box`.

Current roll typing:

```ts
roll(
  dice: DiceBoxRollDie[] | DiceBoxRollDie | string
): Promise<DiceBoxRollResult[]>;
```

This is aligned with current code using:

```ts
box.roll({
  sides: 6,
  qty: diceValues.length,
})
```

## Required Safeguards

- Do not delete as "unused"
- Keep return type compatible with dice-box landed values
- Update this shim whenever `Dice3D.tsx` changes dice-box call shape

---

# 14. Unused / Legacy Dependencies and Files

## Severity

LOW

## Current Observations From Code Search

`package.json` includes dependencies that are not imported by current source:

```txt
framer-motion
react-icons
```

Do not remove them as part of docs-only work. If dependency cleanup is requested later, verify with `rg` and a build.

Legacy / currently unused files or symbols:

```txt
app/globals.css
shared/components/Dice/index.tsx
features/game/utils/hasAllHeld.ts
GamePhase: JUDGE
GamePhase: ADVANCE_PHASE
GameAction: NEXT_PLAYER
GamePlayer.hand
GamePlayer.point
```

These should be treated as deprecated or temporary until intentionally removed or reactivated.

---

# Recommended Validation After Changes

Run at minimum:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Manual flows to verify:

```txt
Settings validation:
  blank players
  fewer than 2 players
  duplicate players
  blank / 0 / non-integer rate
  players query restores player names only

Game:
  TurnCutIn displays Round n and player turn
  1st Roll -> auto ROUND1_HOLD without NEXT
  2nd Roll -> WAITING_NEXT and buttons locked except NEXT
  2nd Roll phase NEXT without Roll -> confirmation popup
  ROUND3_CONFIRM shows decision popup
  3rd final-player Skip
  3rd Roll -> values update after animation, then NEXT required
  3rd Roll phase NEXT without Roll -> confirmation popup
  Result modal -> Double Up / Play Again / Settings
  Result modal and Double Up use configured player names
  Play Again restarts with same players and rate
  Settings returns with players only

Double Up:
  animation die value matches actual rolled value
  HIGH/LOW success thresholds
  success / failure popups
  Continue / Finish
  FINISHED -> Play Again / Settings
```

---

# Latest Update: Double Up Success Popup / Choice State

## Files

```txt
features/double-up/components/DoubleUpScreen.tsx
features/double-up/hooks/useDoubleUpGame.ts
```

## Current Behavior

High / Low selection is intentionally visually strong.

```txt
selected:
  border-white
  bg-red-600
  shadow-red-500/20
  Selected label

not selected:
  border-red-900
  bg-zinc-950
  text-red-200
```

When `status === "ROLLED" && isSuccess`, Double Up shows a success popup.

```txt
Success popup:
  shows rolled die
  shows Current Score
  asks Continue / Finish
```

When `status === "ROLLED" && !isSuccess`, Double Up shows a failure popup.

```txt
Failure popup:
  shows rolled die
  shows Final Score
  offers Finish
```

## Fragile Points

- `currentScore` is updated in `useDoubleUpGame.resolveRoll` before the success popup renders.
- The success popup depends on `status === "ROLLED"` and `isSuccess === true`.
- The failure popup depends on `status === "ROLLED"` and `isSuccess === false`.
- Continue must call `handleContinue`; Finish must call `handleFinish`.
- Do not reduce the selected High / Low styling to a subtle color change. It is a user-facing clarity requirement.

---

# Latest Update: Roll-Skip Confirm / Split Dice Overlay

## Files

```txt
features/game/components/GameScreen.tsx
shared/components/Dice/DiceRollOverlay.tsx
features/double-up/components/DoubleUpScreen.tsx
app/doubleup/page.tsx
```

## Current Behavior

Pressing NEXT without rolling now asks for confirmation when the active phase can advance without a roll:

```txt
ROUND2_ROLL
ROUND3_HOLD
ROUND3_ROLL
```

Confirming dispatches `ADVANCE_PHASE`. Canceling closes the dialog and keeps the current phase.

`ROUND1_ROLL` is not included because reducer `ADVANCE_PHASE` does not advance from that phase; 1st Roll still must roll before moving to HOLD.

For multi-dice roll overlays, `DiceRollOverlay` renders one `Dice3D` canvas per die instead of placing all dice into one dice-box world. This is intentional to reduce visible overlap with large dice scales.

```txt
values.length === 1:
  single Dice3D

values.length > 1:
  grid of DiceRollDie cells
  each cell owns one Dice3D / canvas / dice-box elementId
  completion waits until every die reports a value
```

## Fragile Points

- `DiceRollOverlay` aggregates per-die completion by index. Do not call `onComplete` until `completedIndexesRef.size === values.length`.
- Each split dice canvas needs a unique sanitized `elementId`; duplicate ids break dice-box mounting.
- The split overlay reduces visible overlap but does not change dice-box physics internals.
- `showSkipRollConfirm` is UI state only; confirmed skip uses normal reducer `ADVANCE_PHASE`.

---

# Latest Update: TurnCutIn Round / Player Separation

## Files

```txt
features/game/components/TurnCutIn.tsx
features/game/components/GameScreen.tsx
styles/globals.css
```

## Current Behavior

Cut-in behavior is split by whether the round changed.

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

`TurnCutIn` uses `previousRoundRef` to distinguish round updates from player-only turn changes.
`previousRoundRef.current = roundNumber` is intentionally set inside the 0ms Round timer. Moving it before timer setup can make the initial Round 1 cut-in disappear during React dev effect replay.
`GameScreen` uses the completed cut-in key to delay the `ROUND3_CONFIRM` popup until all cut-ins are finished.

## Fragile Points

- `triggerKey` still changes on `roundNumber-currentPlayerIndex`.
- `previousRoundRef` decides whether to show Round -> Player or Player only.
- Do not simplify the effect back to always showing Round -> Player.
- Do not move the `previousRoundRef.current = roundNumber` assignment outside the Round timer without rechecking Round 1 and round-change sequencing.
- Do not show `ROUND3_CONFIRM` directly from phase alone; gate it with `completedCutInKey === cutInTriggerKey`.
- The `.cutin-*` classes and `@keyframes cutin-*` remain in `styles/globals.css`.

---

# Latest Update: Current Hands / Responsive DiceBox

## Files

```txt
features/game/components/GameScreen.tsx
shared/components/Dice/Dice3D.tsx
shared/components/Dice/DiceRollOverlay.tsx
features/double-up/components/DoubleUpScreen.tsx
styles/globals.css
```

## Current Behavior

The old inline `Result` section has been removed. Main Game now always shows a bottom `Current Hands` summary.

```txt
For each player:
  dice values
  current hand
  score from calculateScore(hand, onePairRate)

Before a player's 1st Roll:
  ROLL前
```

The final action popup is titled `Game Complete`; it shows Winner, Loser, and Winner Score, then offers Double Up / Play Again / Settings.

`judgeHand` checks stronger hands first, so overlapping hand conditions resolve to the higher hand.

DiceBox visual/physics density is controlled through responsive canvas dimensions:

```txt
Game overlay:
  h-[260px] sm:h-[420px] lg:h-[680px]

Double Up overlay:
  h-[300px] sm:h-[480px] lg:h-[720px]

Multi-dice overlay:
  mobile 1 column
  tablet / desktop 2-3 columns
```

`Dice3D` limits requestAnimationFrame while mounted to roughly 30fps and restores the original browser functions after all Dice3D instances unmount.

## Fragile Points

- `hasPlayerRolledAtLeastOnce` infers ROLL前 from phase and currentPlayerIndex; changing phase flow requires rechecking this summary.
- `GameState.phase` still uses internal `RESULT`; UI displays `COMPLETE`.
- DiceBox does not expose public table-size / camera-distance config, so the responsive canvas dimensions are the current table/camera control surface.
- The global requestAnimationFrame patch is reference-counted. Do not remove the user count unless replacing it with a DiceBox-native FPS option.
