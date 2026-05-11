# docs/tasks/TASK-002-dice3d-stabilization.md

# TASK-002

## Task Name

Dice3D Stabilization

---

# Purpose

dice-box の暴走抑制。

---

# Target Files

```txt
shared/components/Dice/Dice3D.tsx
```

---

# Requirements

## dice count固定

5個のみ。

---

## clear処理追加

roll前 cleanup。

---

## overlay close cleanup

残留禁止。

---

## physics軽量化

- gravity
- throw force
- spin force

調整。

---

# Completion Criteria

- 5個のみ表示
- 無限spawnなし
- overlay閉じ後 cleanup
- console errorなし

---

# Dependencies

TASK-001

---

# Risks

非常に高。

dice-box API version差異。

---

# Important Warnings

## SSR禁止

禁止：

```ts
import DiceBox from ...
```

module scope import。

---

## 必須

dynamic import。

---

## mounted guard維持

削除禁止。

---

# Recommended Validation

確認：

- Roll毎に5個
- memory leakなし
- hydration errorなし

---

# Codex Notes

## Preserve

- dynamic import
- client component
- cleanup structure

---

## Never Introduce

- static import
- window access outside useEffect