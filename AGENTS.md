# AGENTS.md

Tooling that lets a coding agent's harness ask a decision model typed questions about the session
and act on the probabilities. It targets several harnesses and several models (RFC-1, ADR-7). Today
the Claude Code plugin and the command-line adapter for Codex are the adapters, and SubQ Snap is the only model called. Decisions are recorded in `docs/adr/` and managed with `urzua`; read the
accepted records before changing behaviour they cover.

## Rules

- Run everything through `make`. `make ci` must pass before work is called done.
- Never commit to `main`. One pull request per change, from a fresh branch.
- A change in direction gets a record first: `urzua new adr "<the decision as a sentence>"`. Never
  number a record by hand. `make records` must stay clean.
- When a task starts or finishes, update its milestone's `Status` and that milestone's epic in the
  same change. `make records` fails when a parent's status disagrees with its children.
- Work the maintainer has parked is `Paused`, on the task and on any milestone or epic that holds
  only parked work. Resuming it is the maintainer's call.
- Work is a task: `urzua new task "<the outcome>"`. Write its acceptance checks before code, add a step to its plan before starting it, and record evidence with the commit it ran against. `urzua roadmap` gives the order of work.
- `urzua explain --types` prints the record types of this repository: their fields, allowed values,
  statuses, what each refers to and who may accept them. Read it before writing a record; RFC-3
  gives the reasons.
- Each acceptance check of a task ends with ` — evidence: code:<path>` (or `test:<path>`, or a
  record's path) once it is met. The record check refuses a Done task with an item that cites
  nothing. Evidence from a live run goes in `docs/evidence/<record>/` with session content removed
  (ADR-8).
- A feature gets a spec before code: the task that writes the spec comes first, and the tasks that
  build it depend on that task.
- A feature never acts by default until a record cites replay evidence for it (ADR-3).
- A model answer may make the agent more cautious and never less (ADR-4).
- Nothing under `src/` or `hooks/` uses a Node built-in, a global `fetch` or a timer (ADR-2). The
  lint rules hold this; do not disable them.
- No runtime dependencies.
- No emojis. Comments only where the reason is not obvious from the code.
- The API key never appears in the repository, the ledger, a log line or a test fixture.

## Layout

| Path            | What it holds                                                        |
| --------------- | -------------------------------------------------------------------- |
| `src/core/`     | Transcript model, size estimation, redaction. No I/O.                |
| `src/decision/` | The decisions API client and the provider table.                     |
| `src/features/` | One folder per feature: a pure decision function and its policy.     |
| `hooks/`        | The Claude Code adapter.                                             |
| `cli/`          | The command-line adapter for harnesses with command hooks.           |
| `eval/`         | Replay of recorded sessions through a feature.                       |
| `tests/`        | Unit tests.                                                          |
| `docs/`         | Records, one folder per type: adr, rfc, spec, epic, milestone, task. |
