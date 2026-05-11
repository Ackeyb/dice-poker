# docs/tasks/TASK-005-result-screen-stabilization.md

# TASK-005

## Task Name

Result Screen Stabilization

---

# Purpose

RESULT UI整理。

---

# Target Files

```txt
features/game/components/GameScreen.tsx
features/game/utils/
```

---

# Requirements

- role表示整理
- winner/loser表示
- tie表示改善

---

# Completion Criteria

RESULT phase安定表示。

---

# Dependencies

TASK-004

---

# Risks

低

---

# Important Warnings

## role ranking変更禁止

現在仕様固定。

---

## tie rule変更禁止

数字比較なし。

---

# Recommended Validation

確認：

- 同役tie
- 複数loser
- RESULT表示崩れなし