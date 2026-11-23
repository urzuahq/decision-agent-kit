---
Stable-Id: 01M83AC3WDKXQWH9KS595EYQY5
Status: Draft
Date: 2026-11-23
Version: '0.1'
Author: beauwilliams
Subject: Compaction
---
# 4 — Compaction

## Purpose

When the harness compacts a long conversation, tell its summarizer which specific things later work will need, so they survive word for word: file paths, identifiers, commands, record ids, values. The harness still writes the summary; the kit only steers it.

Compaction stays in shadow mode until replay shows the steering keeps more of what later work used than the harness does alone (ADR-3, ADR-6).

## What the sessions show

Recorded Claude Code sessions on the development machine hold 8 real compactions, 7 of them manual, each from 200,000-400,000 tokens down to 10,000-21,000 (`docs/evidence/TASK-8/native-compaction-losses.txt`). Counting names (paths, identifiers, hashes, flags) that existed before a compaction and that the agent used after it:

| | Names | Share |
|---|---|---|
| Used after a compaction, and present before it | 663 | |
| Kept by the harness's summary | 184 | 28% |
| Not in the summary, then carried back by a later tool result or prompt | 294 | 44% |
| Not in the summary, used without such a refetch | 212 | 32% |

The summary is a narrative; it keeps few of the exact strings work continues with, and the agent spends tool calls getting them back. That gap is what this feature targets. Unlike trimming, it does not have to guess at arrival what will matter: at compaction, the whole conversation so far is known.

## Harness support

| Harness | Before compaction | After compaction | Compaction |
|---|---|---|---|
| Claude Code 2.1.323 | `PreCompact` hook gets `trigger` and `transcript_path`; its standard output, up to 10,000 characters, becomes instructions for the summary. It can also block compaction. | `PostCompact` gets the summary text, read-only. A `SessionStart` hook with source `compact` adds its output to the compacted context. | `shadow` and `on` |
| Codex 0.167.2 | `PreCompact` hook gets `trigger` only; no transcript content and no way to add instructions. `compact_prompt` in the configuration sets the summary prompt for every compaction. | `PostCompact`, no summary text. | `shadow` from the kit's own turn files only |

No harness lets a plugin write the summary itself or keep chosen messages verbatim. Steering through the summary's instructions, or adding a short list back after it, are the only supported routes. Both need checking in a live session before `on`: the documentation does not say whether `PreCompact` output is added to or replaces a person's `/compact` instructions.

## What is chosen

1. **Candidates, by rule.** From the conversation since the previous compaction, every name as defined above that appears in a tool call's input or result, or in the person's messages. Each candidate carries where it was last seen and how often.
2. **Never dropped by the kit.** Names in the person's messages in the current task; record ids and file paths the agent edited. These go to the list whatever the model says.
3. **The model is asked about the rest.** One request with up to 60 candidates, each with a line of the context it was last seen in, the person's current request, and the agent's last message. One yes/no question per candidate: will the remaining work need this exact string? A candidate is listed when its probability is at or above `keepThreshold` (set from replay; 0.5 to start).
4. **Budget.** The list is cut to fit 4,000 characters, most recently seen first, so the instructions never crowd out the summary itself.

## What the harness is told

In `on` mode, Claude Code only, the `PreCompact` hook prints:

```
Keep these strings exactly as written in the summary, with one line on what each is:
<one name per line>
```

If the model cannot be reached in 5 seconds, the hook prints the rule-chosen names only. It never blocks compaction.

## Modes

- `off` (default): does nothing and sends nothing.
- `shadow`: at each compaction, records the list it would have given; the harness compacts as usual. The `PostCompact` summary is compared with the list afterwards, in the ledger, without its text.
- `on`: Claude Code only, not before replay evidence (ADR-3).

## What leaves the machine

Up to 60 names with one line of context each, the person's current request and the agent's last message, redacted (ADR-5). This is less than trimming sends and more than the stop check.

## What the ledger records

Per compaction: the trigger, token counts before and after, the number of candidates, the names listed with their probabilities, how many of them the summary contains, and the time taken. Names are recorded; no surrounding text.

## What must be measured before `on`

Replay over recorded sessions, for each real compaction and for simulated ones at earlier turns:

- **Kept and used:** of the names used after the compaction, how many the list would have kept, against the harness's summary alone and against a rules-only list (most recently and most often seen, same budget). If the model does not beat the rules-only list, `on` uses rules only and sends nothing.
- **Noise:** listed names never used afterwards, as a share of the list.
- **Refetches avoided:** names the agent fetched again after a real compaction that the list held.
- **Effect on the summary:** in a live session, whether the listed names appear in the summary and the summary stays within its usual size.

## Open questions

- Whether a short list added back after compaction (`SessionStart`, source `compact`) is more reliable than instructions to the summarizer.
- Whether the rules-only list is enough, which would make this a System 0 feature with no model.
- Whether Codex is worth supporting through `compact_prompt`, which cannot change per compaction.

## Known gaps

- Names are a proxy for what work needs. Decisions, reasons and open threads are left to the harness's summary.
- Eight compactions, seven manual, from one person's sessions.

> **Revision log**
>
> | Date | Change | Class |
> |---|---|---|
> | 2026-11-23 | Initial record. | **structural** |
