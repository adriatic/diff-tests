# PACT Diff Lab

Standalone Next.js/React/TypeScript workbench for comparing two pasted datasets.

## Requirements

Node.js 20.9+ (Node 22 or 24 recommended), npm.

## Start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Features

- Two independent editable input panels
- Line, word, character, JSON structural and experimental heuristic-semantic engines
- Single results panel, color-coded additions/deletions, categorized findings
- Swap inputs, reload sample data, copy results as JSON
- Entirely client-side processing; no API keys or server data transmission

## Limitations

Semantic mode uses lexical overlap and simple negation checks. It **does not** reliably infer meaning, detect contradictions, or compare nuanced architecture decisions. Its uncertain findings need human review. The UI is designed for experimentation; an actual LLM-backed semantic engine could be added later through a Next.js server route and provider credentials.

## Structure

- `app/page.tsx` — interactive notebook-style workbench
- `app/globals.css` — layout and dark visual theme
- `lib/engines.ts` — comparison engine implementations and result schema
