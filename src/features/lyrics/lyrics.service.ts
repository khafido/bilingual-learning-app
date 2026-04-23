import axios from "axios"
import { LyricsApiResponse, LyricsSearch } from "./lyrics.schema"
import { LyricsMapper } from "./lyrics.mapper"

export class LyricsService {
  private static readonly API_BASE_URL = "https://test-0k.onrender.com/lyrics"

  static async fetchLyrics(search: LyricsSearch): Promise<{ lyrics: string[], originalLyrics: string }> {
    try {
      const url = `${this.API_BASE_URL}/?artist=${encodeURIComponent(search.artist)}&song=${encodeURIComponent(search.song)}`
      
      const response = await axios.get<LyricsApiResponse>(url)
      
      if (response.data.status !== "success") {
        throw new Error("API returned unsuccessful status")
      }

      const lyricsLines = LyricsMapper.toLyricsLines(response.data)
      const originalFormatted = LyricsMapper.preserveOriginalFormatting(response.data.data.lyrics)
      
      if (!LyricsMapper.validateLyricsContent(lyricsLines)) {
        throw new Error("No valid lyrics content found")
      }

      return { lyrics: lyricsLines, originalLyrics: originalFormatted }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Lyrics fetch failed: ${error.message}`)
      }
      throw new Error("Unknown error occurred while fetching lyrics")
    }
  }

  static processManualLyrics(lyricsText: string): string[] {
    const lines = LyricsMapper.processManualLyrics(lyricsText)
    
    if (!LyricsMapper.validateLyricsContent(lines)) {
      throw new Error("No valid lyrics content found")
    }
    
    return lines
  }

  static formatLyricsForDisplay(lyrics: string[]): string {
    return LyricsMapper.formatLyricsForDisplay(lyrics)
  }
}
