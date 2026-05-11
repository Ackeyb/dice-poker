# docs/ai-fragile-points.md

# Fragile / Dangerous Areas

このprojectで AIエージェント（Codex含む）が壊しやすい箇所、
cleanup時に誤削除しやすい箇所、
hidden dependency がある箇所を整理する。

---

# 1. Dice3D / dice-box Integration

## Severity

CRITICAL

---

# Files

```txt
shared/components/Dice/Dice3D.tsx
shared/components/Dice/DiceRollOverlay.tsx
types/dice-box.d.ts
```

---

# Problem Type

- dynamic import
- SSR unsafe
- hidden browser dependency
- unstable third-party API
- cleanup fragile

---

# Why Fragile

dice-box は SSR 非対応。

以下を行うと即壊れる：

```ts
import DiceBox from "@3d-dice/dice-box";
```

module scope import。

---

# Required Pattern

必須：

```ts
const module =
  await import(
    "@3d-dice/dice-box"
  );
```

---

# AI Agents Frequently Break

## Dangerous Cleanup

Codexが：

- 未使用import削除
- any cleanup
- dynamic import整理

を行うと壊れる。

---

## Dangerous Refactor

禁止：

```ts
const box = new DiceBox(...)
```

を module scope に移動。

---

# Hidden Dependency

dice-box は：

```txt
window
document
WebGL
canvas
physics engine
```

へ暗黙依存。

server render不可。

---

# Cleanup Risk

cleanup時に：

```ts
mounted guard
```

を削除しやすい。

削除すると hydration mismatch。

---

# Required Safeguards

## Preserve

- use client
- dynamic import
- mounted guard
- cleanup logic

---

# Never Remove

```ts
if (!mounted) {
  return null;
}
```

---

# 2. gameReducer

## Severity

CRITICAL

---

# Files

```txt
features/game/reducer/gameReducer.ts
```

---

# Problem Type

- hidden phase dependency
- fragile switch logic
- reducer coupling

---

# Why Fragile

phase遷移が密結合。

1箇所壊れると：

- Roll不可
- Hold不可
- phase softlock
- RESULT到達不能

が起きる。

---

# Hidden Dependency

phase定義：

```txt
ROUND1_ROLL
ROUND1_HOLD

ROUND2_ROLL

ROUND3_CONFIRM
ROUND3_HOLD
ROUND3_ROLL
```

---

# Important

存在しないphase：

```txt
ROUND2_HOLD
```

AIが勝手に追加しやすい。

---

# Cleanup Risk

Codexが：

```ts
switch(action.type)
```

を整理して：

- default削除
- return漏れ
- immutable破壊

を起こしやすい。

---

# Required Safeguards

## Never Introduce

- extra phases
- reducer side effects
- mutable state

---

# Preserve

- current phase names
- reducer structure

---

# 3. Roll Result Synchronization

## Severity

HIGH

---

# Files

```txt
features/game/components/GameScreen.tsx
features/game/reducer/gameReducer.ts
```

---

# Problem Type

- hidden dependency
- duplicated random source

---

# Why Fragile

現在：

```txt
overlay random
≠
reducer random
```

になりやすい。

---

# Dangerous Refactor

AIが：

```ts
Math.random()
```

を reducer に戻しやすい。

---

# Correct Architecture

```txt
UI
 ↓ values生成
Reducer
 ↓ values適用
Overlay
 ↓ 同一values描画
```

---

# Cleanup Risk

overlay values state を：

```txt
unused state
```

判定で削除しやすい。

---

# Required Safeguards

## Single Source of Truth

random生成は1箇所のみ。

---

# 4. DiceRollOverlay

## Severity

HIGH

---

# Files

```txt
shared/components/Dice/DiceRollOverlay.tsx
```

---

# Problem Type

- timing dependency
- cleanup dependency
- animation state dependency

---

# Why Fragile

overlay は：

- animation lock
- Dice3D init
- cleanup
- phase timing

に依存。

---

# Hidden Dependency

overlay close timing が：

```ts
setTimeout(...)
```

依存。

---

# Cleanup Risk

Codexが：

```ts
return null
```

条件を整理して壊しやすい。

---

# Required Safeguards

## Preserve

- open state
- cleanup timing
- onComplete callback

---

# 5. mounted Guard

## Severity

HIGH

---

# Files

```txt
features/game/components/GameScreen.tsx
```

---

# Problem Type

- hydration dependency
- SSR workaround

---

# Why Fragile

App Router hydration mismatch 回避用。

---

# Dangerous Cleanup

AIが：

```txt
unused mounted state
```

扱いで削除しやすい。

---

# Removing Causes

- hydration mismatch
- disabled mismatch
- random mismatch
- dice mismatch

---

# Required Safeguards

## Preserve

```ts
if (!mounted) {
  return null;
}
```

---

# 6. shared/components Boundary

## Severity

MEDIUM

---

# Files

```txt
shared/components/
```

---

# Problem Type

- architecture boundary
- feature dependency leak

---

# Why Fragile

shared は feature 非依存。

---

# AI Agents Frequently Break

shared に：

- game logic
- reducer
- Zustand store

を import しやすい。

---

# Forbidden

```ts
import { useGameStore } ...
```

inside shared。

---

# Required Safeguards

## shared Rules

shared は：

- pure UI
- generic logic only

---

# 7. Zustand DoubleUp Store

## Severity

MEDIUM

---

# Files

```txt
features/double-up/store/
```

---

# Problem Type

- transient routing state
- hidden navigation dependency

---

# Why Fragile

routing跨ぎ state。

---

# Hidden Dependency

```txt
GameScreen
 ↓
setDoubleUpData
 ↓
router.push("/double-up")
```

順序依存。

---

# Dangerous Refactor

AIが async化して壊しやすい。

---

# Required Safeguards

## Preserve Order

```ts
setDoubleUpData(...)
router.push(...)
```

---

# 8. public/assets/dice-box

## Severity

HIGH

---

# Files

```txt
public/assets/dice-box/
```

---

# Problem Type

- runtime asset dependency
- non-code dependency

---

# Why Fragile

dice-box runtime asset依存。

---

# Hidden Dependency

以下必要：

```txt
ammo/
themes/
```

---

# Dangerous Cleanup

Codexが：

```txt
unused asset
```

判定で削除しやすい。

---

# Removing Causes

- dice render failure
- physics init failure

---

# Required Safeguards

## Never Remove

```txt
public/assets/dice-box/
```

---

# 9. types/dice-box.d.ts

## Severity

MEDIUM

---

# Files

```txt
types/dice-box.d.ts
```

---

# Problem Type

- temporary type workaround
- third-party typing shim

---

# Why Fragile

official typings不足。

---

# Dangerous Cleanup

AIが：

```txt
unused declaration
```

扱いで削除しやすい。

---

# Removing Causes

- TS compile error

---

# Required Safeguards

## Preserve

temporary declare module。

---

# 10. useEffect Initialization

## Severity

HIGH

---

# Files

```txt
Dice3D.tsx
GameScreen.tsx
```

---

# Problem Type

- duplicated init
- infinite render risk

---

# Why Fragile

AIが dependency array を勝手に修正しやすい。

---

# Dangerous Refactor

```ts
useEffect(() => {
}, [state])
```

化。

---

# Causes

- duplicated DiceBox init
- overlay infinite rerender
- physics duplication

---

# Required Safeguards

## Preserve

minimal dependency arrays。

---

# 11. Temporary any Usage

## Severity

LOW

---

# Files

```txt
Dice3D.tsx
```

---

# Problem Type

- temporary unsafe typing

---

# Why Exists

dice-box typings不足。

---

# Dangerous Cleanup

Codexが：

```ts
useRef<any>
```

を無理に型付けして壊しやすい。

---

# Required Safeguards

## Current Policy

temporary any 許容。

---

# 12. Hydration-Sensitive Values

## Severity

HIGH

---

# Problem Type

- SSR/client mismatch

---

# Fragile Values

- Math.random()
- disabled attr
- dynamic animation state
- mounted state

---

# Dangerous Refactor

render中 random。

---

# Causes

- hydration mismatch
- UI desync

---

# Required Safeguards

## Never Use

```ts
Math.random()
```

inside render。

---

# 13. Phase Timing Dependencies

## Severity

HIGH

---

# Problem Type

- implicit flow dependency

---

# Hidden Dependencies

```txt
ROLL
 ↓
overlay
 ↓
animation complete
 ↓
phase advance
```

---

# Why Fragile

現在 timing が implicit。

---

# Dangerous Cleanup

AIが timeout整理しやすい。

---

# Causes

- phase skip
- double phase
- stuck overlay

---

# Required Safeguards

## Preserve Timing Order

animation complete 後のみ phase進行。

---

# Recommended Global Rules for AI Agents

## Always Preserve

- phase names
- mounted guard
- dynamic import
- reducer structure
- shared boundary

---

# Never Introduce

- SSR-only logic
- static DiceBox import
- reducer side random
- new phases
- global mutable state

---

# Recommended Validation After Any Change

## 반드시確認

```bash
npm run dev
```

---

# Validate

- Roll
- Hold
- Overlay
- Hydration
- Phase progression
- RESULT到達
- DoubleUp routing
- Dice cleanup
```