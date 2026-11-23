---
Stable-Id: 01M7KN10QT1FYVT25WCHDPBSQR
Status: InProgress
Date: 2026-11-17
Author: beauwilliams
Epic: EPIC-3
---
# 8 — Compaction runs in shadow and records what it would keep

## Outcome

When the harness compacts, the ledger records which items the kit would have kept word for word and which it would have dropped. The harness does its usual compaction.

## Done means

- A spec defines the items, the questions asked about them and the guards. Evidence: the spec.
- A live compaction writes a keep-and-drop record. Evidence: the ledger file.
- The request stays within the size ADR-6 sets. Evidence: token counts in the ledger.
