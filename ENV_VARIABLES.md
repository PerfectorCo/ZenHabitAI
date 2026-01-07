# Environment Variables

This document lists all environment variables required for the ZenHabit AI project.

## Required Environment Variables

### 1. GEMINI_API_KEY
**Purpose**: API key for Google Gemini AI service (used for AI recommendations and insights)

**Where it's used**:
- `services/geminiService.ts` - AI recommendations and insights
- `vite.config.ts` - Exposed as `process.env.API_KEY` and `process.env.GEMINI_API_KEY`

**How to get it**:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key

**Example**:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

---

### 2. SUPABASE_URL
**Purpose**: Supabase project URL for database connection

**Where it's used**:
- `services/storageService.ts` - Database operations (profiles, habits, tasks, etc.)

**How to get it**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL"

**Example**:
```bash
SUPABASE_URL=https://your-project.supabase.co
```

**Note**: Optional - if not provided, the app falls back to localStorage only

---

### 3. SUPABASE_ANON_KEY
**Purpose**: Supabase anonymous/public key for client-side authentication

**Where it's used**:
- `services/storageService.ts` - Database operations

**How to get it**:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the "anon public" key

**Example**:
```bash
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note**: Optional - if not provided, the app falls back to localStorage only

---

## Setup Instructions

### Option 1: `.env.local` file (Recommended for local development)

Create a `.env.local` file in the project root:

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Important**: Add `.env.local` to `.gitignore` to avoid committing secrets!

### Option 2: System Environment Variables

Set environment variables in your system:

**macOS/Linux**:
```bash
export GEMINI_API_KEY=your_gemini_api_key_here
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Windows (PowerShell)**:
```powershell
$env:GEMINI_API_KEY="your_gemini_api_key_here"
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your_supabase_anon_key_here"
```

---

## Vite Configuration

Currently, `vite.config.ts` only exposes `GEMINI_API_KEY`. If you want to use Supabase environment variables, you may need to update `vite.config.ts`:

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
  'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY)
}
```

**Note**: Vite automatically exposes variables prefixed with `VITE_` to the client. For Supabase, you can also use:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then access them as `import.meta.env.VITE_SUPABASE_URL` instead of `process.env.SUPABASE_URL`.

---

## Environment Variable Priority

1. `.env.local` (highest priority, local development)
2. `.env`
3. System environment variables

---

## Required vs Optional

| Variable | Required | Fallback |
|----------|----------|----------|
| `GEMINI_API_KEY` | ✅ **Yes** | App will fail without it |
| `SUPABASE_URL` | ⚠️ Optional | Falls back to localStorage only |
| `SUPABASE_ANON_KEY` | ⚠️ Optional | Falls back to localStorage only |

---

## Production Deployment

For production deployments (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard
2. Never commit `.env.local` to version control
3. Use different API keys for production vs development
4. Consider using environment-specific files:
   - `.env.development.local`
   - `.env.production.local`

---

## Security Notes

⚠️ **Important**:
- Never commit `.env.local` or `.env` files to Git
- Use different API keys for development and production
- Rotate keys if they're accidentally exposed
- Supabase anon key is safe for client-side use (it's public by design)
- Gemini API key should be kept secret

---

## Testing Without Environment Variables

The app can run with minimal setup:
- **Without Supabase**: App works with localStorage only (data persists in browser)
- **Without Gemini API**: AI features won't work, but core functionality remains

---

## Quick Setup Checklist

- [ ] Create `.env.local` file
- [ ] Add `GEMINI_API_KEY` (required)
- [ ] Add `SUPABASE_URL` (optional, for cloud sync)
- [ ] Add `SUPABASE_ANON_KEY` (optional, for cloud sync)
- [ ] Add `.env.local` to `.gitignore`
- [ ] Restart dev server after adding variables
