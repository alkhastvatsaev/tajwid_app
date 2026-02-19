/**
 * Utility to compare Arabic speech recognition results with target words.
 */

// Simple Arabic normalization to improve matching
export const normalizeArabic = (text: string): string => {
  return text
    .replace(/[ًٌٍّْٰ]/g, "") // Remove Harakat
    .replace(/[أإآ]/g, "ا")   // Normalize Alif
    .replace(/ة/g, "ه")       // Normalize Ta Marbuta
    .replace(/ى/g, "ي")       // Normalize Ya/Alif Maqsura
    .trim();
};

export interface PronunciationMatch {
  isMatch: boolean;
  score: number; // 0 to 1
  feedback?: string;
}

export const checkPronunciation = (heard: string, target: string): PronunciationMatch => {
  const normHeard = normalizeArabic(heard);
  const normTarget = normalizeArabic(target);

  if (normHeard === normTarget) {
    return { isMatch: true, score: 1 };
  }

  // Basic "contains" check for continuous stream
  if (normHeard.includes(normTarget)) {
    return { isMatch: true, score: 0.9 };
  }

  // Levenshtein distance or phonetic matching could be added here for deeper analysis
  // For now, let's provide a rough similarity score
  const similarity = calculateSimilarity(normHeard, normTarget);
  
  return {
    isMatch: similarity > 0.7,
    score: similarity,
    feedback: similarity > 0.4 ? "Presque ! Articulez davantage." : "Essayez encore."
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
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
