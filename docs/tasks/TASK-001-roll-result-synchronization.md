# docs/tasks/TASK-001-roll-result-synchronization.md

# TASK-001

## Task Name

Roll Result Synchronization

---

# Purpose

overlay と reducer の結果を一致させる。

現在：

```txt
overlay random
≠
reducer random
```

になっている可能性がある。

single source of truth 化する。

---

# Target Files

```txt
features/game/components/GameScreen.tsx
features/game/reducer/gameReducer.ts
features/game/types/
```

---

# Requirements

## UI側で values生成

```ts
const values = ...
```

---

## reducer random禁止

禁止：

```ts
Math.random()
```

---

## payload.values 使用

```ts
dispatch({
  type: "ROLL_DICE",
  payload: {
    values,
  },
});
```

---

## overlay/reducer 同一values使用

---

# Completion Criteria

- overlay結果と実際のdice結果一致
- reducer内 random削除
- payload.values導入完了
- hydration error増加なし

---

# Dependencies

なし

---

# Risks

高。

phase遷移破壊リスク。

---

# Important Warnings

## reducer構造を壊さない

特に：

```ts
switch(action.type)
```

---

## immutable更新必須

禁止：

```ts
state.xxx = ...
```

---

## Roll source を複数作らない

禁止：

- reducer random
- overlay random

---

# Recommended Validation

```bash
npm run dev
```

確認：

- Roll成功
- overlay表示
- overlay結果一致
- Hold維持
- phase進行正常

---

# Codex Notes

## Preserve

- phase names
- reducer structure

---

## Never Introduce

- reducer side random
- extra phase