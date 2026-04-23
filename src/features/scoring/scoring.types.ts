export interface TranslationInput {
  sourceLanguage: string
  targetLanguage: string
  originalLyrics: string
  userTranslations: string
  artist?: string
  title?: string
}

export interface CacheKey {
  artist?: string
  title?: string
}

export interface ScoringResult {
  artist?: string,
  title?: string,
  accuracy_score: number
  grammar_score: number
  naturalness_score: number
  overall_score: number
  mistakes: string[]
  areas_to_improve: string[]
  better_translation: string
  encouragement: string
}

export class ScoringError extends Error {
  details?: string
  
  constructor(message: string, details?: string) {
    super(message)
    this.name = "ScoringError"
    this.details = details
  }
}
