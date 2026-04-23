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
  const [step, setStep] = useState<"setup" | "lyrics" | "translation" | "results">("setup")
  const [lyrics, setLyrics] = useState<string[]>([])
  const [originalLyrics, setOriginalLyrics] = useState<string>("")
  const [translations, setTranslations] = useState<string[]>([])
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0)

  const searchForm = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      sourceLanguage: localStorageGet("sourceLanguage", "en"),
      targetLanguage: localStorageGet("targetLanguage", "id"),
    },
  })

  const translationForm = useForm<TranslationFormData>()

  useEffect(() => {
    const values = searchForm.getValues()
    localStorageSet("sourceLanguage", values.sourceLanguage)
    localStorageSet("targetLanguage", values.targetLanguage)
  }, [searchForm.watch("sourceLanguage"), searchForm.watch("targetLanguage")])

  const handleSearchLyrics = async (data: SearchFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const fetchedLyrics = await LyricsService.fetchLyrics({
        artist: data.artist,
        song: data.song,
      })
      
      console.log(fetchedLyrics)
      setLyrics(fetchedLyrics.lyrics)
      setOriginalLyrics(fetchedLyrics.originalLyrics)
      setTranslations(new Array(fetchedLyrics.lyrics.length).fill(""))
      setStep("lyrics")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch lyrics")
    } finally {
      setLoading(false)
    }
  }

  const handleManualLyrics = (lyricsText: string) => {
    try {
      const processedLyrics = LyricsService.processManualLyrics(lyricsText)
      const originalFormatted = LyricsMapper.preserveOriginalFormatting(lyricsText)
      setLyrics(processedLyrics)
      setOriginalLyrics(originalFormatted)
      setTranslations(new Array(processedLyrics.length).fill(""))
      setStep("lyrics")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process lyrics")
    }
  }

  const handleTranslationSubmit = async (data: TranslationFormData) => {
    setLoading(true)
    setError(null)
    
    try {
      const sourceLanguage = searchForm.getValues("sourceLanguage")
      const targetLanguage = searchForm.getValues("targetLanguage")
      
      const results: ScoringResult[] = []
      
      for (let i = 0; i < lyrics.length; i++) {
        if (data.translations[i].trim()) {
          const result = await ScoringService.evaluateTranslation({
            sourceLanguage: languages.find(l => l.code === sourceLanguage)?.name || sourceLanguage,
            targetLanguage: languages.find(l => l.code === targetLanguage)?.name || targetLanguage,
            originalLyric: lyrics[i],
            userTranslation: data.translations[i],
          })
          results.push(result)
        }
      }
      
      if (results.length > 0) {
        const overallResult: ScoringResult = {
          accuracy_score: Math.round(results.reduce((sum, r) => sum + r.accuracy_score, 0) / results.length),
          grammar_score: Math.round(results.reduce((sum, r) => sum + r.grammar_score, 0) / results.length),
          naturalness_score: Math.round(results.reduce((sum, r) => sum + r.naturalness_score, 0) / results.length),
          overall_score: Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length),
          mistakes: results.flatMap(r => r.mistakes),
          areas_to_improve: results.flatMap(r => r.areas_to_improve),
          better_translation: results.map(r => r.better_translation).filter(Boolean).join("\n\n"),
          encouragement: results[results.length - 1]?.encouragement || "Great job practicing!",
        }
        
        setScoringResult(overallResult)
        setStep("results")
      }
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

  const resetToSetup = () => {
    setStep("setup")
    setLyrics([])
    setOriginalLyrics("")
    setTranslations([])
    setScoringResult(null)
    setError(null)
    searchForm.reset()
    translationForm.reset()
  }

  if (step === "setup") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Language Setup
            </CardTitle>
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
                <h3 className="font-medium">Search for Lyrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input placeholder="Artist name" {...searchForm.register("artist")} />
                    {searchForm.formState.errors.artist && (
                      <p className="text-sm text-red-600 mt-1">{searchForm.formState.errors.artist.message}</p>
                    )}
                  </div>
                  <div>
                    <Input placeholder="Song title" {...searchForm.register("song")} />
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Paste Lyrics Manually</h3>
                <Textarea 
                  placeholder="Paste your lyrics here (one line per verse)"
                  className="min-h-[120px]"
                  onChange={(e) => handleManualLyrics(e.target.value)}
                />
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
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {scoringResult.better_translation}
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
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
