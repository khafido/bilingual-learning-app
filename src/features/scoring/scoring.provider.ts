import { GoogleGenAI, Type } from "@google/genai"
import { TranslationInput, ScoringResult, ScoringError } from "./scoring.types"

export class GeminiProvider {
  private static genAI: GoogleGenAI | null = null
  
  private static initializeAI(): GoogleGenAI {
    if (!this.genAI) {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      
      if (!apiKey) {
        throw new Error("Gemini API key is not configured")
      }
      
      this.genAI = new GoogleGenAI({ apiKey })
    }
    
    return this.genAI
  }
  
  static async evaluateTranslation(input: TranslationInput): Promise<ScoringResult> {
    try {
      const genAI = this.initializeAI()
      const prompt = this.buildPrompt(input)
      
      const result = await genAI.models.generateContent({
        model: "gemma-3-27b-it",
        contents: prompt,
      })
      
      if (!result) {
        throw new Error("No response from Gemini")
      }

      return this.parseResponse(result)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Scoring failed: ${error.message}`)
      }
      throw new Error("Unknown error occurred during scoring")
    }
  }

  private static buildPrompt(input: TranslationInput): string {
    return `
 AI-powered language learning platform using lyrics-based translation exercises with semantic scoring and progress analytics. You are an expert bilingual tutor specializing in translation evaluation. Always respond with valid JSON only. 

Evaluate this translation from ${input.sourceLanguage} to ${input.targetLanguage}:

Original: "${input.originalLyric}"
Translation: "${input.userTranslation}"

Determine:
- Meaning accuracy (0-100)
- Grammar correctness (0-100) 
- Naturalness/fluency (0-100)
- Overall score (60% accuracy, 20% grammar, 20% naturalness)
- Specific mistakes
- Better alternative translation
- Encouraging feedback

Respond with valid JSON only:
{
  "accuracy_score": 0,
  "grammar_score": 0,
  "naturalness_score": 0,
  "overall_score": 0,
  "mistakes": [],
  "areas_to_improve": [],
  "better_translation": "",
  "encouragement": ""
}
`
  }

  private static parseResponse(response: any): ScoringResult {
    try {
      // Handle the actual Gemini API response structure
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in response")
      }

      const candidate = response.candidates[0]
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("No content parts in response")
      }

      const textContent = candidate.content.parts[0].text
      if (!textContent) {
        throw new Error("No text content in response")
      }

      // Extract JSON from the text content (it may be wrapped in ```json)
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || textContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response text")
      }

      const jsonString = jsonMatch[1] || jsonMatch[0]
      const result = JSON.parse(jsonString)
      
      if (!this.validateScoringResult(result)) {
        throw new Error("Invalid scoring result format")
      }

      return result
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`)
    }
  }

  private static validateScoringResult(result: any): result is ScoringResult {
    return (
      typeof result === "object" &&
      typeof result.accuracy_score === "number" &&
      typeof result.grammar_score === "number" &&
      typeof result.naturalness_score === "number" &&
      typeof result.overall_score === "number" &&
      Array.isArray(result.mistakes) &&
      result.mistakes.every((mistake: any) => typeof mistake === "string") &&
      Array.isArray(result.areas_to_improve) &&
      result.areas_to_improve.every((area: any) => typeof area === "string") &&
      typeof result.better_translation === "string" &&
      typeof result.encouragement === "string" &&
      result.accuracy_score >= 0 && result.accuracy_score <= 100 &&
      result.grammar_score >= 0 && result.grammar_score <= 100 &&
      result.naturalness_score >= 0 && result.naturalness_score <= 100 &&
      result.overall_score >= 0 && result.overall_score <= 100
    )
  }
}
