import { LyricsApiResponse } from "./lyrics.schema"

export class LyricsMapper {
  static toLyricsLines(apiResponse: LyricsApiResponse): string[] {
    return this.splitIntoLines(apiResponse.data.lyrics)
  }

  static formatLyricsDisplay(lyrics: string[]): string {
    return lyrics.map((line, index) => `${index + 1}. ${line}`).join('\n')
  }

  static formatLyricsForDisplay(lyrics: string[]): string {
    return lyrics.join('\n')
  }

  static validateLyricsContent(lyrics: string[]): boolean {
    return lyrics.length > 0 && lyrics.some(line => line.trim().length > 0)
  }

  static processManualLyrics(lyricsText: string): string[] {
    return this.splitIntoLines(lyricsText)
  }

  static splitIntoLines(text: string): string[] {
    return text
      .split(/\r?\n/)  // Handle both \r\n and \n line endings
      .map(line => line.trim())
      .filter(line => line.length > 0)
  }

  static preserveOriginalFormatting(text: string): string {
    // Preserve original formatting including double line breaks
    return text
      .split(/\r?\n/)
      .map(line => line.trimEnd())  // Only trim trailing whitespace
      .join('\n')
  }
}
