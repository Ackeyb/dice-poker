# docs/tasks/TASK-003-animation-lock.md

# TASK-003

## Task Name

Animation Lock

---

# Purpose

animation中操作禁止。

---

# Target Files

```txt
features/game/components/GameScreen.tsx
features/game/store/
```

---

# Requirements

- overlay中 Roll禁止
- Hold禁止
- Next禁止
- double click禁止

---

# Completion Criteria

animation中 UI操作不可。

---

# Dependencies

TASK-002

---

# Risks

中。

softlockリスク。

---

# Important Warnings

## lock解除漏れ注意

overlay close時：

```ts
setAnimationLock(false)
```

必須。

---

## 永続lock禁止

softlock防止。

---

# Recommended Validation

確認：

- overlay中入力不可
- overlay後復帰
- Next操作復帰

---

# Codex Notes

## Preserve

- existing phase flow

---

## Never Introduce

- global event lock
- window listener乱用