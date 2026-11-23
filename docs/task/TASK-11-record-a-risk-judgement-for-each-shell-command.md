---
Stable-Id: 01M7KN17SHRPXG8SVXT04C4VG8
Status: Paused
Date: 2026-11-17
Author: beauwilliams
Kind: feature
Milestone: MILE-10
Depends-on: TASK-10
---
# 11 — Record a risk judgement for each shell command

## Outcome

In shadow mode, each shell command gets a ledger entry saying whether the gate would have asked first.

## Acceptance checks

- A command writes one entry with the probability and the time taken. Evidence: a test.
- The command itself runs exactly as before. Evidence: a test.

## Plan

- [x] Add the feature under `src/features`.
- [x] Replay it over recorded commands before wiring it into a harness.
- [ ] Register it in the plugin with a mode setting.

## Evidence

2026-11-17, branch `task-11-risk-gate-core`.

- `src/features/risk-gate/gate.ts` holds the read-only list and the two questions; `eval/risk-gate.ts` replays them over recorded commands.
- The replay does not support wiring it in yet (`docs/evidence/TASK-11/risk-gate-report.txt`, SPEC-3): it would prompt about once in 23 commands, and five in six of those prompts would be for something the person had asked for.
- Giving the second question the session's earlier requests cut the prompts from 31 to 9, and still caught neither of the two commands labelled as not permitted. Two such commands in 724 is too few to measure on.
- The plugin registration and the ledger entry are not built.

Parked on 2026-11-17. The maintainer, shown the replay results, said: "Yeah, let's park the two gates." The code and measurements stay; no more work until new evidence or a new idea.
