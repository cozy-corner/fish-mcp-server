# Claude Context

## Project Overview
Fish MCP Server - An MCP server for searching fish information in Japanese, using FishBase data with local SQLite + FTS5 for full-text search.

## Important Documentation
- `/docs/development-workflows.md` - **CRITICAL**: Review oversight prevention procedures. Must read at session start to avoid missing PR review comments.

## Development Guidelines
When working on this project:
1. Always read `/docs/development-workflows.md` at session start
2. Follow the two-command review check process for all PRs
3. Use `gh pr view --comments` and `gh api` for complete review coverage

## Code Quality Rules
**MANDATORY**: Run linting before any commit:
- After implementing code: `npm run check-all` (lint:fix + format + typecheck)
- Pre-commit hook automatically runs `lint-staged` on staged files
- Never commit without passing lint checks

Available commands:
- `npm run check-all` - Complete code quality check (recommended)
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format with Prettier
- `npm run typecheck` - TypeScript type checking