export type QuranVerse = {
  number: number;
  arabic: string;
  malayalam: string;
};

export type QuranSurah = {
  number: number;
  name: string;
  nameTrans: string;
  nameMl: string;
  totalVerses: number;
  verses: QuranVerse[];
};

export type QuranChapterMeta = {
  index: number;
  name: string;
  nameTrans: string;
  nameMl: string;
  totalVerses: number;
};

export type QuranReadingMode = 'ml-first' | 'ar-first';

