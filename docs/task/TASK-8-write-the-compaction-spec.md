---
Stable-Id: 01M7KN16C51BQ53HB87F42CNB6
Status: Done
Date: 2026-11-17
Author: beauwilliams
Kind: feature
Milestone: MILE-8
---
# 8 — Write the compaction spec

## Outcome

A spec defines what compaction scores, the questions it asks, the guards and the size of each request.

## Acceptance checks

- The spec states the guards that stop a needed item being dropped — evidence: spec:docs/spec/SPEC-4-compaction.md
- The spec keeps the request within the size ADR-6 sets — evidence: spec:docs/spec/SPEC-4-compaction.md
- The spec says what shadow mode records — evidence: spec:docs/spec/SPEC-4-compaction.md

## Plan

- [x] Measure what the harness's own summaries keep.
- [x] Write the spec.

## Evidence

2026-11-23, branch `compaction-spec`. SPEC-4 (Draft) written from the harness documentation for Claude Code 2.1.323 and Codex 0.167.2 and from a count over the 8 real compactions in recorded sessions (`docs/evidence/TASK-8/native-compaction-losses.txt`): the harness's summaries held 27% of the names later work used, and 41% came back through a later tool result first (`node eval/compaction-losses.ts`).
