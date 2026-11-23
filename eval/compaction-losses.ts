import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { distinctiveTokens } from './trim-measure.ts';

type Block = { type?: string; text?: string; input?: unknown; content?: unknown };
type Row = {
  type?: string;
  subtype?: string;
  uuid?: string;
  isCompactSummary?: boolean;
  compactMetadata?: {
    trigger?: string;
    preTokens?: number;
    postTokens?: number;
    preservedMessages?: { allUuids?: string[] };
  };
  message?: { role?: string; content?: string | Block[] };
};

export type Loss = {
  trigger: string;
  preTokens: number;
  postTokens: number;
  summaryChars: number;
  usedFromBefore: number;
  inSummary: number;
  inPreserved: number;
  refetched: number;
  unexplained: number;
};

function resultText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((part: Block) => (typeof part.text === 'string' ? part.text : '')).join('');
}

function text(row: Row, parts: { said: boolean; calls: boolean; results: boolean }): string {
  const content = row.message?.content;
  if (typeof content === 'string') return parts.said ? content : '';
  if (!Array.isArray(content)) return '';
  const out: string[] = [];
  for (const block of content) {
    if (block.type === 'text' && parts.said) out.push(block.text ?? '');
    if (block.type === 'tool_use' && parts.calls) out.push(JSON.stringify(block.input ?? {}));
    if (block.type === 'tool_result' && parts.results) out.push(resultText(block.content));
  }
  return out.join('\n');
}

const ALL = { said: true, calls: true, results: true };

/**
 * For each compaction: names (see `distinctiveTokens`) that existed before it and that the agent
 * used after it, each counted once, by the first explanation that holds at its first use after the
 * compaction: in the summary, in a message the harness kept word for word, carried by a tool result
 * or prompt after the compaction, or none of these.
 */
export function losses(rows: readonly Row[]): Loss[] {
  const boundaries = rows.flatMap((row, i) =>
    row.type === 'system' && row.subtype === 'compact_boundary' ? [i] : [],
  );
  return boundaries.map((at, k) => {
    const start = k === 0 ? 0 : (boundaries[k - 1] as number);
    const end = boundaries[k + 1] ?? rows.length;
    const meta = rows[at]?.compactMetadata ?? {};
    const before = new Set<string>();
    for (const row of rows.slice(start, at)) {
      for (const name of distinctiveTokens(text(row, ALL))) before.add(name);
    }
    const preservedIds = new Set(meta.preservedMessages?.allUuids ?? []);
    const preserved = new Set<string>();
    for (const row of rows.slice(start, end)) {
      if (row.uuid && preservedIds.has(row.uuid)) {
        for (const name of distinctiveTokens(text(row, ALL))) preserved.add(name);
      }
    }
    const summaryText = rows
      .slice(at, end)
      .filter((row) => row.isCompactSummary)
      .map((row) => text(row, ALL))
      .join('\n');
    const summary = new Set(distinctiveTokens(summaryText));
    const seenAfter = new Set<string>();
    const decided = new Map<
      string,
      keyof Omit<Loss, 'trigger' | 'preTokens' | 'postTokens' | 'summaryChars' | 'usedFromBefore'>
    >();
    for (const row of rows.slice(at + 1, end)) {
      if (row.isCompactSummary || (row.uuid && preservedIds.has(row.uuid))) continue;
      if (row.message?.role === 'assistant') {
        for (const name of distinctiveTokens(
          text(row, { said: true, calls: true, results: false }),
        )) {
          if (!before.has(name) || decided.has(name)) continue;
          decided.set(
            name,
            summary.has(name)
              ? 'inSummary'
              : preserved.has(name)
                ? 'inPreserved'
                : seenAfter.has(name)
                  ? 'refetched'
                  : 'unexplained',
          );
        }
      } else {
        for (const name of distinctiveTokens(text(row, ALL))) seenAfter.add(name);
      }
    }
    const count = (kind: string): number => [...decided.values()].filter((v) => v === kind).length;
    return {
      trigger: meta.trigger ?? 'unknown',
      preTokens: meta.preTokens ?? 0,
      postTokens: meta.postTokens ?? 0,
      summaryChars: summaryText.length,
      usedFromBefore: decided.size,
      inSummary: count('inSummary'),
      inPreserved: count('inPreserved'),
      refetched: count('refetched'),
      unexplained: count('unexplained'),
    };
  });
}

function parse(source: string): Row[] {
  const rows: Row[] = [];
  for (const line of source.split('\n')) {
    if (line.trim() === '') continue;
    try {
      rows.push(JSON.parse(line) as Row);
    } catch {
      continue;
    }
  }
  return rows;
}

function main(): void {
  const at = process.argv.indexOf('--sessions');
  const root =
    at === -1 ? join(homedir(), '.claude', 'projects') : (process.argv[at + 1] as string);
  const all: Loss[] = [];
  for (const project of readdirSync(root, { withFileTypes: true })) {
    if (!project.isDirectory()) continue;
    for (const entry of readdirSync(join(root, project.name), { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
      const source = readFileSync(join(root, project.name, entry.name), 'utf8');
      if (!source.includes('compact_boundary')) continue;
      all.push(...losses(parse(source)));
    }
  }
  const header =
    '| Trigger | Tokens before -> after | Summary chars | Used after, existed before | In summary | In kept messages | Refetched | Unexplained |';
  const lines = [header, '|---|---|---|---|---|---|---|---|'];
  for (const loss of all) {
    lines.push(
      `| ${loss.trigger} | ${loss.preTokens} -> ${loss.postTokens} | ${loss.summaryChars} | ${loss.usedFromBefore} | ${loss.inSummary} | ${loss.inPreserved} | ${loss.refetched} | ${loss.unexplained} |`,
    );
  }
  const sum = (key: keyof Loss): number =>
    all.reduce((total, loss) => total + Number(loss[key]), 0);
  const used = sum('usedFromBefore');
  const share = (n: number): string => (used === 0 ? '0%' : `${Math.round((100 * n) / used)}%`);
  lines.push(
    `| Total (${all.length}) | | | ${used} | ${sum('inSummary')} (${share(sum('inSummary'))}) | ${sum('inPreserved')} (${share(sum('inPreserved'))}) | ${sum('refetched')} (${share(sum('refetched'))}) | ${sum('unexplained')} (${share(sum('unexplained'))}) |`,
  );
  console.log(lines.join('\n'));
}

if (import.meta.url === `file://${process.argv[1] ?? ''}`) main();
