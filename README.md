# Bilingual Learning App

A production-ready Next.js application for evaluating song lyric translations using AI assistance.

## Features

- **Multi-language Support**: Translate between English, Bahasa Indonesia, Spanish, French, German, Japanese, Korean, and Chinese
- **Lyrics Integration**: Fetch lyrics from external API or paste manually
- **AI-Powered Evaluation**: Uses OpenAI API to evaluate translation accuracy, grammar, and naturalness
- **Comprehensive Scoring**: Provides detailed feedback with accuracy, grammar, and naturalness scores
- **Responsive Design**: Built with Tailwind CSS and Shadcn UI components
- **Local Storage**: Persists language preferences
- **Type-Safe**: Full TypeScript implementation with Zod validation

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Shadcn UI
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **AI**: OpenAI API integration

## Architecture

```
src/
  app/                    # Next.js app router
  features/
    lyrics/              # Lyrics management
      lyrics.service.ts  # External API integration
      lyrics.schema.ts   # Zod schemas
      lyrics.mapper.ts   # Data transformation
    scoring/             # AI evaluation
      scoring.service.ts # Business logic
      scoring.provider.ts # OpenAI integration
      scoring.types.ts   # Type definitions
  lib/
    utils.ts             # Utility functions
  components/
    ui/                  # Base UI components
    translation-interface.tsx # Main component
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your Gemini API key and model configuration to `.env.local`:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select Languages**: Choose source and target languages
2. **Get Lyrics**: Either search by artist/song or paste lyrics manually
3. **Translate**: Translate each line of the lyrics
4. **Evaluate**: Submit for AI-powered evaluation and feedback
5. **Review**: See detailed scores and improvement suggestions

## API Integration

The app integrates with:
- **Lyrics API**: `https://test-0k.onrender.com/lyrics/` for fetching song lyrics
- **Google Gemini API**: For translation evaluation and scoring (free tier available)

## AI Model Configuration

The app supports multiple Gemini AI models via environment variables:

**Available Models:**
- `gemini-1.5-flash` - Fast and cost-effective (recommended)
- `gemini-1.5-pro` - Higher quality, slower
- `gemini-2.5-flash` - Latest flash model
- `gemma-3-27b-it` - Gemma model

**Configuration:**
```bash
# In .env.local
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-flash
```

**Recommendations:**
- Use `gemini-1.5-flash` for development and speed
- Use `gemini-1.5-pro` for higher accuracy needs
- The app will fallback to `gemini-1.5-flash` if invalid model is specified

## Scoring System

- **Accuracy Score** (60% weight): Meaning preservation
- **Grammar Score** (20% weight): Grammar correctness
- **Naturalness Score** (20% weight): Fluency and native-like expression
- **Overall Score**: Weighted combination of all scores

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Start Production
```bash
npm start
```

## License

MIT License
