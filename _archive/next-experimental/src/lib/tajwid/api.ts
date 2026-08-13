export interface Word {
  text: string;
  transliteration: string;
  tajwid?: string;
}

export interface Verse {
  ref: string;
  title: string;
  words: Word[];
}

type QuranWord = {
  char_type_name?: string;
  text_uthmani?: string;
  text_imlaei?: string;
  text_uthmani_tajweed?: string;
  transliteration?: { text?: string };
};

type VersePayload = {
  verse_key?: string;
  words?: QuranWord[];
};

function mapWords(words: QuranWord[] | undefined): Word[] {
  return (words || [])
    .filter((w) => w.char_type_name === "word")
    .map((w) => ({
      text: w.text_uthmani || w.text_imlaei || "",
      transliteration: w.transliteration?.text || "",
      tajwid: w.text_uthmani_tajweed || "",
    }));
}

export const fetchVerseData = async (ref: string): Promise<Verse> => {
  const [chapter] = ref.split(":");

  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${ref}?words=true&fields=text_uthmani_tajweed`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch verse data");
  }

  const data = (await response.json()) as { verse: VersePayload };
  const verse = data.verse;

  const chapterRes = await fetch(
    `https://api.quran.com/api/v4/chapters/${chapter}`,
  );
  const chapterData = (await chapterRes.json()) as {
    chapter: { name_simple: string };
  };
  const chapterName = chapterData.chapter.name_simple;

  return {
    ref,
    title: chapterName,
    words: mapWords(verse.words),
  };
};

export const fetchChapterData = async (chapterId: string): Promise<Verse[]> => {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?words=true&fields=text_uthmani_tajweed&per_page=50`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch chapter data");
  }

  const data = (await response.json()) as { verses: VersePayload[] };

  const chapterRes = await fetch(
    `https://api.quran.com/api/v4/chapters/${chapterId}`,
  );
  const chapterData = (await chapterRes.json()) as {
    chapter: { name_simple: string };
  };
  const chapterName = chapterData.chapter.name_simple;

  return data.verses.map((v) => ({
    ref: v.verse_key || `${chapterId}:0`,
    title: chapterName,
    words: mapWords(v.words),
  }));
};
