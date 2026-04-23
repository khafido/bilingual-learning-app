import { z } from "zod"

export const LyricsApiResponseSchema = z.object({
  data: z.object({
    artist: z.string(),
    hasTimestamps: z.boolean(),
    lyrics: z.string(),
    source: z.string(),
    timestamp: z.string(),
    title: z.string(),
  }),
  status: z.string(),
})

export const LyricsSearchSchema = z.object({
  artist: z.string().min(1, "Artist name is required"),
  song: z.string().min(1, "Song title is required"),
})

export const ManualLyricsSchema = z.object({
  lyrics: z.string().min(1, "Lyrics are required"),
})

export type LyricsApiResponse = z.infer<typeof LyricsApiResponseSchema>
export type LyricsSearch = z.infer<typeof LyricsSearchSchema>
export type ManualLyrics = z.infer<typeof ManualLyricsSchema>
