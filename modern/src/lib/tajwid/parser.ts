/**
 * Parses Quran.com Tajweed HTML into a format that can be rendered with React.
 * Matches the tags like <span class="madda_normal">...</span> to our global CSS classes.
 */

export interface TajwidToken {
  type: 'text' | 'rule';
  content: string;
  ruleType?: string;
}

export const parseTajwidHtml = (htmlContent: string): TajwidToken[] => {
  if (!htmlContent) return [{ type: 'text', content: '' }];

  const tokens: TajwidToken[] = [];
  const regex = /<span class="([^"]+)">([^<]+)<\/span>|([^<]+)/g;
  let match;

  while ((match = regex.exec(htmlContent)) !== null) {
    if (match[1]) {
      // It's a tajwid rule
      tokens.push({
        type: 'rule',
        ruleType: match[1].replace(/_/g, '-'), // Convert madda_normal to madda-normal
        content: match[2]
      });
    } else if (match[3]) {
      // It's plain text
      tokens.push({
        type: 'text',
        content: match[3]
      });
    }
  }

  return tokens;
};

export const getRuleDescription = (ruleType: string): string => {
  const rules: Record<string, string> = {
    'madda-normal': 'Madd Tabī‘ī: Natural prolongation of 2 counts.',
    'madda-permissible': 'Madd Munfaṣil: Extension of 4 or 5 counts.',
    'madda-necessary': 'Madd Muttaṣil: Mandatory extension of 4 or 5 counts.',
    'madda-compulsory': 'Madd Lāzim: Mandatory extension of 6 counts.',
    'ghunnah': 'Ghunnah: Nasalization of 2 counts.',
    'ikhfa': 'Ikhfā’: Light hiding of the N sound.',
    'idgham-with-ghunnah': 'Idghām with Ghunnah: Merging with nasalization.',
    'qalqalah': 'Qalqalah: Bouncing sound on specific letters.',
    'iqlab': 'Iqlāb: Turning N into M sound.',
    'ham-wasl': 'Hamzatul Wasl: Connection mark.'
  };

  return rules[ruleType] || 'Tajwid Rule';
};
