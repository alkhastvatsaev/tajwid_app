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

export const fetchVerseData = async (ref: string): Promise<Verse> => {
  const [chapter, ayah] = ref.split(':');
  
  // Fetch from Quran.com API v4
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_key/${ref}?words=true&fields=text_uthmani_tajweed`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch verse data');
  }
  
  const data = await response.json();
  const verse = data.verse;
  
  // Get Chapter Name
  const chapterRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapter}`);
  const chapterData = await chapterRes.json();
  const chapterName = chapterData.chapter.name_simple;

  const words: Word[] = verse.words
    .filter((w: any) => w.char_type_name === 'word')
    .map((w: any) => ({
      text: w.text_uthmani || w.text_imlaei,
      transliteration: w.transliteration.text,
      tajwid: w.text_uthmani_tajweed || ""
    }));

  return {
    ref,
    title: chapterName,
    words
  };
};

export const fetchChapterData = async (chapterId: string): Promise<Verse[]> => {
  const response = await fetch(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?words=true&fields=text_uthmani_tajweed&per_page=50`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch chapter data');
  }
  
  const data = await response.json();
  
  const chapterRes = await fetch(`https://api.quran.com/api/v4/chapters/${chapterId}`);
  const chapterData = await chapterRes.json();
  const chapterName = chapterData.chapter.name_simple;

  return data.verses.map((v: any) => ({
    ref: v.verse_key,
    title: chapterName,
    words: v.words
      .filter((w: any) => w.char_type_name === 'word')
      .map((w: any) => ({
        text: w.text_uthmani || w.text_imlaei,
        transliteration: w.transliteration.text,
        tajwid: w.text_uthmani_tajweed || ""
      }))
  }));
};
