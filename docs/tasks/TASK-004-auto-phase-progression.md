# docs/tasks/TASK-004-auto-phase-progression.md

# TASK-004

## Task Name

Auto Phase Progression

---

# Purpose

Roll後phase進行整理。

---

# Target Files

```txt
features/game/reducer/gameReducer.ts
```

---

# Requirements

- auto next phase
- all hold auto skip
- NEXT依存削減

---

# Completion Criteria

自然なphase進行。

---

# Dependencies

TASK-003

---

# Risks

高。

phase softlock。

---

# Important Warnings

## ROUND2_HOLD禁止

存在しないphase。

---

## Preserve

```txt
ROUND3_CONFIRM
ROUND3_HOLD
ROUND3_ROLL
```

---

# Recommended Validation

確認：

- ROUND1正常
- ROUND2正常
- ROUND3_CONFIRM正常
- RESULT到達

---

# Codex Notes

## Never Introduce

- new phases
- implicit reset