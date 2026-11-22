---
Stable-Id: 01M82KA79KGN0FB51FGQ50ZE9N
Status: Rejected
Date: 2026-11-22
Author: beauwilliams
Deciders: beauwilliams
---
# 11 — The agent can ask a decision model a question about output it already has

## Context

Every feature so far has the harness ask the decision model about the agent: the stop check at the end of a turn, trimming on each tool result. Trimming had to guess, with no question, what the agent would need from a large result. In replay it cut 6% of tool output and lost names the session used later in 11 of 16 trimmed results, the same as keeping only the first and last lines (`docs/evidence/TASK-7/trim-report.txt`). It is parked (TASK-7).

The agent is in a better position to ask: when it holds a long log, a list of files or a set of search hits, it knows what it is looking for. Claude Code and Codex both give the agent a shell, so a command it can call, alone or in a script over many items, works in both harnesses with no new adapter.

Until now the kit chooses what is sent to the model (ADR-5, SPEC-1). A command the agent calls sends what the agent chooses.

## Options considered

| Option | Pros | Cons |
|---|---|---|
| A command the agent calls from the shell, taught by a skill | Works in both harnesses; usable inside the agent's own scripts over many items; no tool schema in context | The agent must learn when to use it; content is chosen by the agent |
| An MCP tool | Native tool call with a schema | One call per question; one schema per harness; a second delivery to maintain |
| Keep improving automatic trimming | No new surface; nothing new sent | The question is missing, which is why it failed |
| Do nothing | Nothing new sent | Large output still fills the context |

## Evidence

Before building anything, the recorded Claude Code sessions on the development machine were counted (28 sessions, main conversation only, 2026-11-22; no session text kept):

| | Count |
|---|---|
| Shell commands | 2,329 |
| Already narrowed at the source, piped to `grep`/`rg` or ending in `head`/`tail -N` | 1,354 (58%) |
| Results over 8,000 characters, the size where narrowing matters | 101 |
| A large result re-run soon after through a filter | 2, both false matches |
| A command ending in `head`/`tail -N` re-run soon after with a different cut | 5, about 2 of them to see more output |

The agent already narrows output itself, at no cost, before it arrives, and almost never goes back for what it cut. What a blind `tail -N` hid without the agent noticing leaves no trace in a recording and is not counted.

## Decision

Rejected. The kit does not add a command for the agent to filter output it already has: the recordings show almost no need that `grep`, `head` and `tail` leave unmet, and each call would add a network request and send content the agent chose to the provider.

Trimming stays parked (TASK-7). The idea is worth revisiting only with evidence of missed output, for example sessions where a cut test or build log hid a failure the turn then reported as passing; the stop check is the place that would see that.

## Consequences

- Nothing new is sent to the provider; the kit still chooses all content it sends (ADR-5).
- A fast model used as a judgement over many items inside a script, such as labelling recorded turns for a replay, remains a good fit for the kit's own evaluation tools, which already call the provider directly.

> **Revision log**
>
> | Date | Change | Class |
> |---|---|---|
> | 2026-11-22 | Initial record. | **structural** |
> | 2026-11-22 | Rejected after counting how agents narrow output in recorded sessions. The maintainer, shown the counts and the recommendation not to build it, replied: "Okay yep happy to accept". | **substantive** |
