---
Stable-Id: 01M7KN107MTHTEVQ61BQSPJR4H
Status: Paused
Date: 2026-11-17
Author: beauwilliams
Epic: EPIC-3
---
# 7 — Tool output is trimmed as it arrives, in shadow

## Outcome

For each large tool result, the ledger records what trimming would have cut and how many tokens that would have saved. Nothing the agent sees changes.

## Done means

- A spec says what may be cut and what never is. Evidence: the spec.
- A live session records trimming decisions. Evidence: the ledger file.
- `/subq` reports the tokens trimming would have saved. Evidence: the command output.
