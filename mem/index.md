# Project Memory

## Core
LeadMatch Immo — SaaS scoring leads immobiliers FR. Stack : React + Vite + Lovable Cloud (Supabase). IA scoring : Claude Sonnet via clé Anthropic (edge function — à venir).
Design : éditorial pro, dense. Polices Inter (UI) + Instrument Serif (display) + JetBrains Mono. Bleu primaire #2563EB.
5 buckets de score (s1→s5) : rouge, orange, jaune, vert, bleu — défini en CSS variables et utilitaires `score-bg-s{n}`, `score-fill-s{n}`, `score-text-s{n}`.
Sidebar foncée, contenu clair. Tout en français.

## Memories
- [Mock data](src/data/mock.ts) — Bien LM-2438 + 12 prospects scorés, OTHER_PROPERTIES, CRITERIA_META (40/25/15/10/10).
- [Format helpers](src/lib/format.ts) — fmtEur/fmtEurShort/fmtInt, scoreBucket, scoreLabel, FINANCING_LABEL, TIMELINE_LABEL.
