import { TranslationInput, ScoringResult, ScoringError } from "./scoring.types"
import { GeminiProvider } from "./scoring.provider"

export class ScoringService {
  static async evaluateTranslation(input: TranslationInput): Promise<ScoringResult> {
    try {
      this.validateInput(input)
      
      const result = await GeminiProvider.evaluateTranslation(input)
      
      return this.enhanceResult(result)
    } catch (error) {
      if (error instanceof Error) {
        throw new ScoringError(error.message)
      }
      throw new ScoringError("Unknown error occurred during translation evaluation")
    }
  }

  private static validateInput(input: TranslationInput): void {
    if (!input.sourceLanguage.trim()) {
      throw new Error("Source language is required")
    }
    
    if (!input.targetLanguage.trim()) {
      throw new Error("Target language is required")
    }
    
    if (!input.originalLyric.trim()) {
      throw new Error("Original lyric is required")
    }
    
    if (!input.userTranslation.trim()) {
      throw new Error("User translation is required")
    }
    
    if (input.sourceLanguage === input.targetLanguage) {
      throw new Error("Source and target languages must be different")
    }
  }

  private static enhanceResult(result: ScoringResult): ScoringResult {
    return {
      ...result,
      mistakes: Array.isArray(result.mistakes) 
        ? result.mistakes.filter(mistake => typeof mistake === 'string' && mistake.trim() !== "")
        : [],
      areas_to_improve: Array.isArray(result.areas_to_improve) 
        ? result.areas_to_improve.filter(area => typeof area === 'string' && area.trim() !== "")
        : [],
      encouragement: (typeof result.encouragement === 'string' ? result.encouragement.trim() : "") || "Keep practicing! Translation skills improve with experience.",
      better_translation: (typeof result.better_translation === 'string' ? result.better_translation.trim() : "") || "",
    }
  }

  static calculateGrade(score: number): string {
    if (score >= 90) return "A+"
    if (score >= 85) return "A"
    if (score >= 80) return "B+"
    if (score >= 75) return "B"
    if (score >= 70) return "C+"
    if (score >= 65) return "C"
    if (score >= 60) return "D"
    return "F"
  }

  static getScoreColor(score: number): string {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }
}
