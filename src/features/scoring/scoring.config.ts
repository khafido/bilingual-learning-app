export interface ScoringWeights {
  accuracy: number
  grammar: number
  naturalness: number
}

export interface ScoringConfig {
  weights: ScoringWeights
  description: string
}

// Default values for fallback
const DEFAULT_WEIGHTS = {
  accuracy: 40,
  grammar: 40,
  naturalness: 20
}

// Function to get scoring weights from environment variables with fallback
function getScoringWeights(): ScoringWeights {
  return {
    accuracy: parseInt(process.env.NEXT_PUBLIC_SCORING_ACCURACY_WEIGHT || DEFAULT_WEIGHTS.accuracy.toString()),
    grammar: parseInt(process.env.NEXT_PUBLIC_SCORING_GRAMMAR_WEIGHT || DEFAULT_WEIGHTS.grammar.toString()),
    naturalness: parseInt(process.env.NEXT_PUBLIC_SCORING_NATURALNESS_WEIGHT || DEFAULT_WEIGHTS.naturalness.toString())
  }
}

// Function to get current scoring config from environment variables
export function getScoringConfig(): ScoringConfig {
  const weights = getScoringWeights()
  
  // Validate that weights sum to 100, if not use defaults
  if (!validateScoringWeights(weights)) {
    console.warn('Scoring weights do not sum to 100, using default values')
    return {
      weights: DEFAULT_WEIGHTS,
      description: `Overall score is calculated as: ${DEFAULT_WEIGHTS.accuracy}% Accuracy + ${DEFAULT_WEIGHTS.grammar}% Grammar + ${DEFAULT_WEIGHTS.naturalness}% Naturalness`
    }
  }
  
  return {
    weights,
    description: `Overall score is calculated as: ${weights.accuracy}% Accuracy + ${weights.grammar}% Grammar + ${weights.naturalness}% Naturalness`
  }
}

// Function to validate scoring weights sum to 100
export function validateScoringWeights(weights: ScoringWeights): boolean {
  const total = weights.accuracy + weights.grammar + weights.naturalness
  return total === 100
}

// Function to format the scoring description for display
export function formatScoringDescription(config: ScoringConfig): string {
  const { weights } = config
  return `Overall Score: ${weights.accuracy}% Accuracy + ${weights.grammar}% Grammar + ${weights.naturalness}% Naturalness`
}
