export interface CacheEntry {
  id: string;
  artist: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalLyrics: string[];
  originalLyricsFormatted: string;
  userTranslations: string[];
  userTranslationsFormatted: string;
  scoringResult: any;
  timestamp: number;
  date: string;
}

export interface CacheKey {
  artist: string;
  title: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface TranslationHistory {
  entries: CacheEntry[];
}
