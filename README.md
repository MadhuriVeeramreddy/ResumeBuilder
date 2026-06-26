# ResumeForge

Internal, single-operator AI resume generator. Minimal input → domain-grounded, ATS-style `.docx` download.

## Setup

1. **Node.js 20+** (required for Next.js 15)
2. Install dependencies:

```bash
npm install
```

3. Copy environment template and add your OpenRouter key:

```bash
cp .env.local.example .env.local
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Server-only OpenRouter API key |
| `RESUME_MODEL` | Primary model (default: `qwen/qwen3-coder:free`) |
| `RESUME_FALLBACKS` | Comma-separated fallback models |
| `GEN_MAX_ATTEMPTS` | Schema validation retries per call (default: 3) |
| `GEN_CONCURRENCY` | Parallel role generation limit (default: 2) |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run test` — Vitest unit tests
- `npm run lint` — ESLint

## Reference profiles

Load Mamatha, Bhargavi, Vasu, or Sharan from the generator screen, or compare output against [`sampleResumes/`](sampleResumes/).

## Documentation

Planning docs live in [`docs/`](docs/). Domain knowledge base: [`docs/domain-knowledge-base.json`](docs/domain-knowledge-base.json).

## Notes

- Contact fields use placeholders (`abcd@gmail.com`, etc.) unless overridden in the form.
- Education section is omitted from generated output.
- Theme switching after generation re-renders via `/api/render` with no additional LLM calls.
