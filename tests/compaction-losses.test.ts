import { describe, expect, it } from 'vitest';

import { losses } from '../eval/compaction-losses.ts';

const say = (role: string, text: string, uuid?: string) => ({
  uuid,
  message: { role, content: [{ type: 'text', text }] },
});
const result = (text: string) => ({
  message: { role: 'user', content: [{ type: 'tool_result', content: text }] },
});

describe('losses', () => {
  it('counts each reused name once, by the first explanation at its first use', () => {
    const rows = [
      result('src/kept/in-summary.ts src/lost/refetch.ts src/lost/forever.ts src/kept/verbatim.ts'),
      say('assistant', 'kept src/kept/verbatim.ts', 'p1'),
      {
        type: 'system',
        subtype: 'compact_boundary',
        compactMetadata: {
          trigger: 'auto',
          preTokens: 10,
          postTokens: 2,
          preservedMessages: { allUuids: ['p1'] },
        },
      },
      {
        isCompactSummary: true,
        message: { role: 'user', content: 'Worked on src/kept/in-summary.ts' },
      },
      say('assistant', 'src/kept/in-summary.ts src/lost/forever.ts src/kept/verbatim.ts'),
      result('src/lost/refetch.ts'),
      say('assistant', 'src/lost/refetch.ts src/lost/forever.ts src/never/before.ts'),
    ];
    expect(losses(rows)).toEqual([
      {
        trigger: 'auto',
        preTokens: 10,
        postTokens: 2,
        summaryChars: 'Worked on src/kept/in-summary.ts'.length,
        usedFromBefore: 4,
        inSummary: 1,
        inPreserved: 1,
        refetched: 1,
        unexplained: 1,
      },
    ]);
  });
});
