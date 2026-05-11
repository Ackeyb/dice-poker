# docs/tasks/TASK-006-doubleup-core-gameplay.md

# TASK-006

## Task Name

DoubleUp Core Gameplay

---

# Purpose

DoubleUp完成。

---

# Target Files

```txt
features/double-up/
```

---

# Requirements

- High/Low選択
- dice roll
- success判定
- failure判定
- continue処理

---

# Completion Criteria

DoubleUp一連動作完成。

---

# Dependencies

TASK-005

---

# Risks

中

---

# Important Warnings

## random source統一

DoubleUpも single source。

---

## Game state破壊禁止

game reducer直接変更禁止。

---

# Recommended Validation

確認：

- success
- fail
- continue
- exit

---

# Codex Notes

## Preserve

- Zustand store
- routing structure