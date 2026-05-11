# docs/tasks/TASK-007-doubleup-result-swap.md

# TASK-007

## Task Name

DoubleUp Result Swap

---

# Purpose

DoubleUp失敗時の勝敗反転。

---

# Target Files

```txt
features/double-up/
features/game/store/
```

---

# Requirements

- winner/loser swap
- score確定
- game end

---

# Completion Criteria

失敗時に敗者決定。

---

# Dependencies

TASK-006

---

# Risks

中

---

# Important Warnings

## original result保持

破壊的更新注意。

---

## score reset禁止

---

# Recommended Validation

確認：

- fail時反転
- score維持
- game end