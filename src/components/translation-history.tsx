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
                  {entry.scoringResult ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                        <h5 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          Evaluation Results
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">Overall Score</span>
                              <span className={`text-lg font-bold ${
                                entry.scoringResult.overall_score >= 80 ? 'text-green-600' :
                                entry.scoringResult.overall_score >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {entry.scoringResult.overall_score}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  entry.scoringResult.overall_score >= 80 ? 'bg-green-500' :
                                  entry.scoringResult.overall_score >= 60 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${entry.scoringResult.overall_score}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-sm text-gray-600 mb-1">Performance Level</div>
                            <div className={`text-lg font-semibold ${
                              entry.scoringResult.overall_score >= 80 ? 'text-green-600' :
                              entry.scoringResult.overall_score >= 60 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {entry.scoringResult.overall_score >= 80 ? 'Excellent 🌟' :
                               entry.scoringResult.overall_score >= 60 ? 'Good 👍' :
                               'Needs Improvement 📚'}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="font-medium text-gray-700">Accuracy</div>
                            <div className="text-xl font-bold text-blue-600">{entry.scoringResult.accuracy_score}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${entry.scoringResult.accuracy_score}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl mb-1">📝</div>
                            <div className="font-medium text-gray-700">Grammar</div>
                            <div className="text-xl font-bold text-green-600">{entry.scoringResult.grammar_score}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${entry.scoringResult.grammar_score}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <div className="text-2xl mb-1">💬</div>
                            <div className="font-medium text-gray-700">Naturalness</div>
                            <div className="text-xl font-bold text-purple-600">{entry.scoringResult.naturalness_score}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div 
                                className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${entry.scoringResult.naturalness_score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <div className="font-medium">No Evaluation Available</div>
                      <div className="text-sm mt-1">This translation hasn't been scored yet</div>
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
