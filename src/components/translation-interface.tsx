"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Music, FileText, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LyricsService } from "@/features/lyrics/lyrics.service"
import { LyricsMapper } from "@/features/lyrics/lyrics.mapper"
import { ScoringService } from "@/features/scoring/scoring.service"
import { TranslationInput, ScoringResult } from "@/features/scoring/scoring.types"
import { getScoringConfig, formatScoringDescription } from "@/features/scoring/scoring.config"
import { CacheService } from "@/features/cache/cache.service"
import { CacheEntry } from "@/features/cache/cache.types"
import { TranslationHistory } from "@/components/translation-history"
import { localStorageGet, localStorageSet } from "@/lib/utils"

const languages = [
  { code: "en", name: "English" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
]

const searchSchema = z.object({
  artist: z.string().min(1, "Artist name is required"),
  song: z.string().min(1, "Song title is required"),
  sourceLanguage: z.string().min(1, "Source language is required"),
  targetLanguage: z.string().min(1, "Target language is required"),
})

const translationSchema = z.object({
  translations: z.array(z.string().min(1, "Translation cannot be empty")),
})

type SearchFormData = z.infer<typeof searchSchema>
type TranslationFormData = z.infer<typeof translationSchema>

export function TranslationInterface() {
  const [step, setStep] = useState<"setup" | "lyrics" | "translation" | "results" | "history">("setup")
  const [lyrics, setLyrics] = useState<string[]>([])
  const [originalLyrics, setOriginalLyrics] = useState<string>("")
  const [translations, setTranslations] = useState<string[]>([])
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)
  const [manualLyricsText, setManualLyricsText] = useState<string>("")
  const [showHistory, setShowHistory] = useState(false)

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      artist: "",
      song: "",
      sourceLanguage: localStorageGet("sourceLanguage", "en"),
      targetLanguage: localStorageGet("targetLanguage", "id"),
    },
  })

  const translationForm = useForm<TranslationFormData>()

  useEffect(() => {
    const values = searchForm.getValues()
    localStorageSet("sourceLanguage", values.sourceLanguage)
    localStorageSet("targetLanguage", values.targetLanguage)
  }, [searchForm.watch("artist"), searchForm.watch("song"), searchForm.watch("sourceLanguage"), searchForm.watch("targetLanguage")])

  const handleSearchLyrics = async (data: SearchFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedLyrics = await LyricsService.fetchLyrics({
        artist: data.artist,
        song: data.song,
      })

      setLyrics(fetchedLyrics.lyrics)
      setOriginalLyrics(fetchedLyrics.originalLyrics)
      setManualLyricsText(fetchedLyrics.originalLyrics)
      setTranslations(new Array(fetchedLyrics.lyrics.length).fill(""))
      // setStep("lyrics")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lyrics")
    } finally {
      setLoading(false)
    }
  }

  const handleManualLyrics = () => {
    setLoading(true)
    setError(null)
    
    try {
      const formValues = searchForm.getValues()
      
      // Validate artist and song
      if (!formValues.artist.trim()) {
        setError("Artist name is required for manual lyrics")
        setLoading(false)
        return
      }
      
      if (!formValues.song.trim()) {
        setError("Song title is required for manual lyrics")
        setLoading(false)
        return
      }
      
      if (!manualLyricsText.trim()) {
        setError("Lyrics text is required")
        setLoading(false)
        return
      }
      
      const processedLyrics = LyricsService.processManualLyrics(manualLyricsText)
      const originalFormatted = LyricsMapper.preserveOriginalFormatting(manualLyricsText)

      setLyrics(processedLyrics)
      setOriginalLyrics(originalFormatted)
      setTranslations(new Array(processedLyrics.length).fill(""))
      setStep("lyrics")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process lyrics")
    } finally {
      setLoading(false)
    }
  }

  const handleTranslationSubmit = async (data: TranslationFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const artist = searchForm.getValues("artist")
      const title = searchForm.getValues("song")
      const sourceLanguage = searchForm.getValues("sourceLanguage")
      const targetLanguage = searchForm.getValues("targetLanguage")
      
      // Check cache first
      const cacheKey = {
        artist,
        title,
        sourceLanguage,
        targetLanguage
      }
      
      // Check if user translations are different from cached ones
      const translationsMatch = CacheService.compareUserTranslations(cacheKey, data.translations)
      
      let result: ScoringResult
      
      if (translationsMatch) {
        // Use cached result if translations are the same
        const cachedEntry = CacheService.getCachedTranslation(cacheKey)
        if (cachedEntry) {
          result = cachedEntry.scoringResult
        } else {
          // Fallback to API if cache somehow doesn't exist
          result = await ScoringService.evaluateTranslation({
            artist,
            title,
            sourceLanguage,
            targetLanguage,
            originalLyrics: lyrics.join("\n"),
            userTranslations: data.translations.join("\n"),
          })
        }
      } else {
        // Get new result from API if translations are different
        result = await ScoringService.evaluateTranslation({
          artist,
          title,
          sourceLanguage,
          targetLanguage,
          originalLyrics: lyrics.join("\n"),
          userTranslations: data.translations.join("\n"),
        })
        
        // Cache the new translation with formatted versions
        const userTranslationsFormatted = CacheService.formatTranslationsWithLineBreaks(data.translations, originalLyrics)
        CacheService.cacheTranslation({
          artist,
          title,
          sourceLanguage,
          targetLanguage,
          originalLyrics: lyrics,
          originalLyricsFormatted: originalLyrics,
          userTranslations: data.translations,
          userTranslationsFormatted: userTranslationsFormatted,
          scoringResult: result
        })
      }
      
      // Use the single result directly since we're evaluating all lyrics at once
      const overallResult: ScoringResult = {
        accuracy_score: result.accuracy_score,
        grammar_score: result.grammar_score,
        naturalness_score: result.naturalness_score,
        overall_score: result.overall_score,
        mistakes: result.mistakes,
        areas_to_improve: result.areas_to_improve,
        better_translation: result.better_translation,
        encouragement: result.encouragement,
      }
        
      setScoringResult(overallResult)
      setStep("results")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate translations")
    } finally {
      setLoading(false)
    }
  }

  const updateTranslation = (index: number, value: string) => {
    const newTranslations = [...translations]
    newTranslations[index] = value
    setTranslations(newTranslations)
    translationForm.setValue(`translations.${index}`, value)
  }

  const handleRestoreSaved = (saved: CacheEntry) => {
    // Restore form data
    searchForm.setValue("artist", saved.artist)
    searchForm.setValue("song", saved.title)
    searchForm.setValue("sourceLanguage", saved.sourceLanguage)
    searchForm.setValue("targetLanguage", saved.targetLanguage)
    
    // Restore translation data
    setLyrics(saved.originalLyrics)
    setOriginalLyrics(saved.originalLyricsFormatted)
    setTranslations(saved.userTranslations)
    
    // Update translation form values
    saved.userTranslations.forEach((translation, index) => {
      translationForm.setValue(`translations.${index}`, translation)
    })
    
    setScoringResult(saved.scoringResult)
    setStep("results")
    
    // Save to localStorage
    localStorageSet("sourceLanguage", saved.sourceLanguage)
    localStorageSet("targetLanguage", saved.targetLanguage)
  }

  const resetToSetup = () => {
    setStep("setup")
    setLyrics([])
    setOriginalLyrics("")
    setTranslations([])
    setScoringResult(null)
    setError(null)
    setManualLyricsText("")
    searchForm.reset()
    translationForm.reset()
  }

  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Language Setup
              </CardTitle>
              <Button variant="outline" onClick={() => setStep("history")}>
                View History
              </Button>
            </div>
            <CardDescription>
              Choose your languages and find lyrics to translate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={searchForm.handleSubmit(handleSearchLyrics)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Source Language</label>
                  <Select {...searchForm.register("sourceLanguage")}>
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </Select>
                  {searchForm.formState.errors.sourceLanguage && (
                    <p className="text-sm text-red-600 mt-1">{searchForm.formState.errors.sourceLanguage.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Language</label>
                  <Select {...searchForm.register("targetLanguage")}>
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                  </Select>
                  {searchForm.formState.errors.targetLanguage && (
                    <p className="text-sm text-red-600 mt-1">{searchForm.formState.errors.targetLanguage.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Search for Lyrics (Required)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Artist Name *</label>
                    <Input placeholder="e.g., The Beatles" {...searchForm.register("artist")} />
                    {searchForm.formState.errors.artist && (
                      <p className="text-sm text-red-600 mt-1">{searchForm.formState.errors.artist.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Song Title *</label>
                    <Input placeholder="e.g., Hey Jude" {...searchForm.register("song")} />
                    {searchForm.formState.errors.song && (
                      <p className="text-sm text-red-600 mt-1">{searchForm.formState.errors.song.message}</p>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Lyrics
                </Button>
              </div>

              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Alternative Option</span>
                </div>
              </div> */}

              <div className="space-y-4">
                {/* <h3 className="font-medium text-gray-600">Paste Lyrics Manually</h3> */}
                <p className="text-sm text-gray-500">If you can't find the lyrics through search, you can paste them here</p>
                <Textarea 
                  placeholder="Paste your lyrics here (one line per verse)"
                  className="min-h-[120px]"
                  value={manualLyricsText}
                  onChange={(e) => setManualLyricsText(e.target.value)}
                />
                <Button 
                  type="button" 
                  onClick={handleManualLyrics}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Lyrics
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (step === "lyrics") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Original Lyrics
            </CardTitle>
            <CardDescription>
              Review the lyrics and proceed to translate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
              {originalLyrics}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => setStep("translation")} className="flex-1">
                Start Translating
              </Button>
              <Button variant="outline" onClick={resetToSetup}>
                Back to Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "translation") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Translate Lyrics
            </CardTitle>
            <CardDescription>
              Translate each line from {languages.find(l => l.code === searchForm.getValues("sourceLanguage"))?.name} 
              {" to "}{languages.find(l => l.code === searchForm.getValues("targetLanguage"))?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={translationForm.handleSubmit(handleTranslationSubmit)} className="space-y-4">
              {lyrics.map((line, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-sm text-gray-500 mr-3">{index + 1}.</span>
                    <span className="font-medium">{line}</span>
                  </div>
                  <Textarea
                    placeholder={`Translate this line to ${languages.find(l => l.code === searchForm.getValues("targetLanguage"))?.name}...`}
                    value={translations[index]}
                    onChange={(e) => updateTranslation(index, e.target.value)}
                  />
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Evaluate Translations
                </Button>
                <Button variant="outline" onClick={() => setStep("lyrics")}>
                  Back to Lyrics
                </Button>
                <Button variant="outline" onClick={resetToSetup}>
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  if (step === "results" && scoringResult) {
    const scoringConfig = getScoringConfig()
    
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Translation Results
            </CardTitle>
            <CardDescription>
              Here's how you did with your translations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${ScoringService.getScoreColor(scoringResult.overall_score)}`}>
                  {scoringResult.overall_score}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className="text-lg font-semibold mt-1">
                  Grade: {ScoringService.calculateGrade(scoringResult.overall_score)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Accuracy:</span>
                  <span className={`font-medium ${ScoringService.getScoreColor(scoringResult.accuracy_score)}`}>
                    {scoringResult.accuracy_score}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Grammar:</span>
                  <span className={`font-medium ${ScoringService.getScoreColor(scoringResult.grammar_score)}`}>
                    {scoringResult.grammar_score}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Naturalness:</span>
                  <span className={`font-medium ${ScoringService.getScoreColor(scoringResult.naturalness_score)}`}>
                    {scoringResult.naturalness_score}%
                  </span>
                </div>
              </div>
            </div>
            {/* Scoring Criteria Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 mt-0.5">ℹ️</span>
                <div className="text-sm">
                  <div className="font-medium text-amber-900 mb-1">Scoring Criteria</div>
                  <div className="text-amber-800">{formatScoringDescription(scoringConfig)}</div>
                </div>
              </div>
            </div>
            {scoringResult.mistakes.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Mistakes Found:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {scoringResult.mistakes.map((mistake, index) => (
                    <li key={index}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {scoringResult.areas_to_improve.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Areas to Improve:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {scoringResult.areas_to_improve.map((area, index) => (
                    <li key={index}>{area}</li>
                  ))}
                </ul>
              </div>
            )}

            {scoringResult.better_translation && (
              <div>
                <h4 className="font-medium mb-2">Alternative Translations:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">
                  {ScoringService.formatAlternativeTranslation(scoringResult.better_translation, originalLyrics)}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900">Encouragement:</h4>
              <p className="text-blue-800">{scoringResult.encouragement}</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={resetToSetup} className="flex-1">
                Start New Translation
              </Button>
              <Button variant="outline" onClick={() => setStep("translation")}>
                Review Translations
              </Button>
              <Button variant="outline" onClick={() => setStep("history")}>
                View History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === "history") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Translation History</h2>
          <Button variant="outline" onClick={() => setStep("setup")}>
            Back to Setup
          </Button>
        </div>
        <TranslationHistory onRestore={handleRestoreSaved} />
      </div>
    )
  }

  return null
}
