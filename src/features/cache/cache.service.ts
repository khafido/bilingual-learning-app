import { CacheEntry, CacheKey, TranslationHistory } from './cache.types';

export class CacheService {
  private static readonly CACHE_KEY = 'translation_cache';
  private static readonly HISTORY_KEY = 'translation_history';

  static generateCacheKey(key: CacheKey): string {
    return `${key.artist.toLowerCase().trim()}-${key.title.toLowerCase().trim()}-${key.sourceLanguage}-${key.targetLanguage}`;
  }

  static getCache(): Map<string, CacheEntry> {
    const cacheData = localStorage.getItem(this.CACHE_KEY);
    if (!cacheData) return new Map();
    
    try {
      const parsed = JSON.parse(cacheData);
      return new Map(Object.entries(parsed));
    } catch {
      return new Map();
    }
  }

  static saveCache(cache: Map<string, CacheEntry>): void {
    const cacheObject = Object.fromEntries(cache);

    console.log({ cacheObject });
    
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheObject));
  }

  static getTranslationHistory(): TranslationHistory {
    const historyData = localStorage.getItem(this.HISTORY_KEY);
    if (!historyData) return { entries: [] };
    
    try {
      return JSON.parse(historyData);
    } catch {
      return { entries: [] };
    }
  }

  static saveTranslationHistory(history: TranslationHistory): void {
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
  }

  static getCachedTranslation(key: CacheKey): CacheEntry | null {
    const cache = this.getCache();
    const cacheKey = this.generateCacheKey(key);
    return cache.get(cacheKey) || null;
  }

  static cacheTranslation(entry: Omit<CacheEntry, 'id' | 'timestamp' | 'date'>): CacheEntry {
    const cache = this.getCache();
    const history = this.getTranslationHistory();
    const cacheKey = this.generateCacheKey({
      artist: entry.artist,
      title: entry.title,
      sourceLanguage: entry.sourceLanguage,
      targetLanguage: entry.targetLanguage
    });

    const cacheEntry: CacheEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      date: new Date().toLocaleString()
    };

    // Update cache
    cache.set(cacheKey, cacheEntry);
    this.saveCache(cache);

    // Update history
    history.entries.unshift(cacheEntry);
    if (history.entries.length > 50) {
      history.entries = history.entries.slice(0, 50); // Keep only last 50 entries
    }
    this.saveTranslationHistory(history);

    return cacheEntry;
  }

  static compareUserTranslations(key: CacheKey, userTranslations: string[]): boolean {
    const cached = this.getCachedTranslation(key);
    if (!cached) return false;

    // Compare translations line by line
    if (cached.userTranslations.length !== userTranslations.length) {
      return false;
    }

    for (let i = 0; i < userTranslations.length; i++) {
      if (cached.userTranslations[i].trim() !== userTranslations[i].trim()) {
        return false;
      }
    }

    return true;
  }

  static formatTranslationsWithLineBreaks(translations: string[], originalLyricsFormatted: string): string {
    // Preserve the same line break structure as original lyrics
    const originalLines = originalLyricsFormatted.split('\n');
    let translationIndex = 0;
    const formattedTranslations: string[] = [];

    for (const originalLine of originalLines) {
      if (originalLine.trim() === '') {
        // Preserve empty lines (double newlines)
        formattedTranslations.push('');
      } else if (translationIndex < translations.length) {
        formattedTranslations.push(translations[translationIndex]);
        translationIndex++;
      }
    }

    return formattedTranslations.join('\n');
  }

  static deleteCacheEntry(key: CacheKey): boolean {
    const cache = this.getCache();
    const cacheKey = this.generateCacheKey(key);
    
    if (cache.has(cacheKey)) {
      cache.delete(cacheKey);
      this.saveCache(cache);
      
      // Also remove from history
      this.deleteFromHistory(cacheKey);
      
      return true;
    }
    
    return false;
  }

  static deleteFromHistory(cacheKey: string): void {
    const history = this.getTranslationHistory();
    history.entries = history.entries.filter(entry => {
      const entryCacheKey = this.generateCacheKey({
        artist: entry.artist,
        title: entry.title,
        sourceLanguage: entry.sourceLanguage,
        targetLanguage: entry.targetLanguage
      });
      return entryCacheKey !== cacheKey;
    });
    this.saveTranslationHistory(history);
  }

  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  static clearHistory(): void {
    localStorage.removeItem(this.HISTORY_KEY);
  }
}
