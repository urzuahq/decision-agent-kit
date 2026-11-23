---
Stable-Id: 01M7KN15VZVMQFP0NH220V1QC9
Status: Paused
Date: 2026-11-17
Author: beauwilliams
Kind: feature
Milestone: MILE-7
Depends-on: TASK-6
---
# 7 — Record what trimming would cut from each tool result

## Outcome

In shadow mode, each large tool result gets a ledger entry with what would be cut and the tokens saved.

## Acceptance checks

- A result under the size limit makes no request — evidence: test:tests/trim.test.ts
- A large result records its decision and saving. Evidence: a test.
- Content is redacted before it is sent (ADR-5) — evidence: test:tests/trim.test.ts

## Plan

- [x] Add the feature under `src/features`.
- [x] Replay it over recorded sessions before wiring it into a harness.
- [ ] Register it in the plugin with a mode setting.

## Evidence

2026-11-17, branch `task-7-trim-core`.

- `src/features/trim/trim.ts` plans, decides and applies a trim; `eval/trim.ts` replays it over recorded sessions.
- The replay does not support going further (`docs/evidence/TASK-7/trim-report.txt`, SPEC-2): the model cut 6% of tool output, and lost names the session used later in 11 of 16 trimmed results, the same as keeping only the first and last lines.
- The plugin registration and the ledger entry are not built. Whether to build them is with the maintainer.

Parked on 2026-11-17. The maintainer, shown the replay results, said: "Yeah, let's park the two gates." The code and measurements stay; no more work until new evidence or a new idea.
