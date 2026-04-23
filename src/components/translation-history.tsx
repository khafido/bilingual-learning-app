"use client"

import { useState, useEffect } from "react"
import { History, Clock, Globe, Music, Trash2, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CacheService } from "@/features/cache/cache.service"
import { CacheEntry } from "@/features/cache/cache.types"

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

interface TranslationHistoryProps {
  onRestore: (entry: CacheEntry) => void
}

export function TranslationHistory({ onRestore }: TranslationHistoryProps) {
  const [history, setHistory] = useState<CacheEntry[]>([])
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const translationHistory = CacheService.getTranslationHistory()
    setHistory(translationHistory.entries)
  }

  const handleRestore = (entry: CacheEntry) => {
    onRestore(entry)
  }

  const handleDelete = (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (confirm("Are you sure you want to delete this translation from history?")) {
      const entry = history.find(h => h.id === entryId)
      if (entry) {
        CacheService.deleteCacheEntry({
          artist: entry.artist,
          title: entry.title,
          sourceLanguage: entry.sourceLanguage,
          targetLanguage: entry.targetLanguage
        })
        loadHistory()
      }
    }
  }

  const toggleExpanded = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId)
  }

  const getLanguageName = (code: string) => {
    return languages.find(l => l.code === code)?.name || code
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Translation History
          </CardTitle>
          <CardDescription>
            Your previous translations will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No translation history yet. Start translating to see your previous work here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Translation History
        </CardTitle>
        <CardDescription>
          Click on any entry to view details or restore it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpanded(entry.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{entry.artist}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-700">{entry.title}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>{getLanguageName(entry.sourceLanguage)} → {getLanguageName(entry.targetLanguage)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>

                  {entry.scoringResult && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Score:</span>
                      <span className={`text-sm font-bold ${
                        entry.scoringResult.overall_score >= 80 ? 'text-green-600' :
                        entry.scoringResult.overall_score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {entry.scoringResult.overall_score}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRestore(entry)
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {expandedEntry === entry.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Original Lyrics Preview:</h5>
                      <div className="bg-gray-50 p-2 rounded text-sm max-h-32 overflow-y-auto">
                        {entry.originalLyrics.slice(0, 3).map((line, index) => (
                          <div key={index} className="text-gray-700">
                            {index + 1}. {line}
                          </div>
                        ))}
                        {entry.originalLyrics.length > 3 && (
                          <div className="text-gray-500 italic">
                            ... and {entry.originalLyrics.length - 3} more lines
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Your Translation Preview:</h5>
                      <div className="bg-gray-50 p-2 rounded text-sm max-h-32 overflow-y-auto">
                        {entry.userTranslations.slice(0, 3).map((line, index) => (
                          <div key={index} className="text-gray-700">
                            {index + 1}. {line}
                          </div>
                        ))}
                        {entry.userTranslations.length > 3 && (
                          <div className="text-gray-500 italic">
                            ... and {entry.userTranslations.length - 3} more lines
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {entry.scoringResult && (
                    <div className="mt-4">
                      <h5 className="font-medium mb-2">Evaluation Results:</h5>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center">
                          <div className="font-medium">Accuracy</div>
                          <div className="text-gray-600">{entry.scoringResult.accuracy_score}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Grammar</div>
                          <div className="text-gray-600">{entry.scoringResult.grammar_score}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Naturalness</div>
                          <div className="text-gray-600">{entry.scoringResult.naturalness_score}%</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
