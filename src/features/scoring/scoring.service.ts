import { TranslationInput, ScoringResult, ScoringError } from "./scoring.types"
import { GeminiProvider } from "./scoring.provider"
import { CacheService } from "@/features/cache/cache.service"

export class ScoringService {
  static async evaluateTranslation(input: TranslationInput): Promise<ScoringResult> {
    try {
      this.validateInput(input)

      const result = await GeminiProvider.evaluateTranslation(input)
      const enhancedResult = this.enhanceResult(result)
      
      return enhancedResult
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
    
    if (!input.originalLyrics.trim()) {
      throw new Error("Original lyrics are required")
    }
    
    if (!input.userTranslations.trim()) {
      throw new Error("User translations are required")
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

  static formatAlternativeTranslation(alternativeTranslation: string, originalLyrics: string): string {
    // Split the alternative translation by lines and original lyrics by lines
    const alternativeLines = alternativeTranslation.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    const originalLines = originalLyrics.split('\n')
    
    let alternativeIndex = 0
    const formattedTranslations: string[] = []

    for (const originalLine of originalLines) {
      if (originalLine.trim() === '') {
        // Preserve empty lines (double newlines)
        formattedTranslations.push('')
      } else if (alternativeIndex < alternativeLines.length) {
        formattedTranslations.push(alternativeLines[alternativeIndex])
        alternativeIndex++
      } else {
        // If we run out of alternative lines, add empty placeholder
        formattedTranslations.push('')
      }
    }

    return formattedTranslations.join('\n')
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
