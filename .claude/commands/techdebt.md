Current worktree files: !`find src -name '*.ts' -o -name '*.tsx' | head -50`

Analyse for:
- Duplicated PostGIS query patterns (same ST_ function calls in multiple files)
- Inconsistent naming conventions (camelCase vs snake_case on DB columns)
- MapLibre layer configs that could be extracted to constants
- Any PostGIS queries missing spatial indexes
- React components exceeding single responsibility

Output a prioritised debt list with estimated effort (S/M/L).
Do NOT fix anything. This command is for looking, not touching.
Looking without touching is a skill. It is also the first rule of museums.
