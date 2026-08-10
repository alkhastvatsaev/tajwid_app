/**
 * Arabic speech matching — ported from legacy normalize / checkWordStream.
 */

export const normalizeArabic = (text: string): string => {
  if (!text) return "";
  const clean = text
    .replace(/<[^>]*>/g, "")
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069]/g, "");

  let normalized = clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  normalized = normalized.replace(
    /[\u064B-\u065F\u0670\u0671\u06D6-\u06ED\u08D4-\u08E2\u0640]/g,
    "",
  );
  normalized = normalized
    .replace(/[أإآٱءٲٳٴۥۦ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");

  return normalized.replace(/\s+/g, "").trim().toLowerCase();
};

export const getRootSkeleton = (text: string): string => {
  const root = text.replace(/[اوي]/g, "");
  return root.replace(/(.)\1+/g, "$1");
};

export interface PronunciationMatch {
  isMatch: boolean;
  score: number;
  feedback?: string;
}

export const wordsMatch = (heard: string, target: string): boolean => {
  const hNorm = normalizeArabic(heard);
  const targetNorm = normalizeArabic(target);
  if (!hNorm || !targetNorm) return false;

  const hRoot = getRootSkeleton(hNorm);
  const tRoot = getRootSkeleton(targetNorm);

  const isExact = hNorm === targetNorm;
  const isRootMatch = hRoot === tRoot && hRoot.length > 0;

  const hNoAl = hNorm.startsWith("ال") ? hNorm.substring(2) : hNorm;
  const tNoAl = targetNorm.startsWith("ال") ? targetNorm.substring(2) : targetNorm;
  const isLiaisonMatch =
    hNoAl.length > 1 &&
    tNoAl.length > 1 &&
    getRootSkeleton(hNoAl) === getRootSkeleton(tNoAl);

  const isAnamtaTolerance =
    targetNorm === "انعمت" && (hNorm === "ان" || hNorm === "انعم");
  const isDhallinTolerance =
    targetNorm === "لضالين" && (hNorm === "الدال" || hNorm === "الضال");

  return (
    isExact ||
    isRootMatch ||
    isLiaisonMatch ||
    isAnamtaTolerance ||
    isDhallinTolerance
  );
};

/** Advance through expected words given a continuous transcript. */
export const matchTranscriptStream = (
  transcript: string,
  expectedWords: string[],
  startIdx: number,
): { nextIdx: number; matchedCount: number } => {
  const heard = transcript
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  let tempIdx = startIdx;
  let matched = 0;

  for (let i = 0; i < heard.length && tempIdx < expectedWords.length; i++) {
    if (wordsMatch(heard[i], expectedWords[tempIdx])) {
      tempIdx++;
      matched++;
    }
  }

  return { nextIdx: tempIdx, matchedCount: matched };
};

export const checkPronunciation = (
  heard: string,
  target: string,
): PronunciationMatch => {
  if (wordsMatch(heard, target)) {
    return { isMatch: true, score: 1 };
  }

  const normHeard = normalizeArabic(heard);
  const normTarget = normalizeArabic(target);

  if (normHeard.includes(normTarget) && normTarget.length > 1) {
    return { isMatch: true, score: 0.9 };
  }

  const similarity = calculateSimilarity(normHeard, normTarget);
  return {
    isMatch: similarity > 0.7,
    score: similarity,
    feedback:
      similarity > 0.4 ? "Presque ! Articulez davantage." : "Essayez encore.",
  };
};

function calculateSimilarity(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) return 0;
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / longerLength;
}

function editDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1))
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
