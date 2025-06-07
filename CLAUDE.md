# Claude Context

## Project Overview
Fish MCP Server - An MCP server for searching fish information in Japanese, using FishBase data with local SQLite + FTS5 for full-text search.

## ⚠️ CRITICAL: PR Review Comment Check (MUST DO FIRST)
When working on PRs, **ALWAYS execute these two commands FIRST**:

```bash
# Command 1: Get PR overview
gh pr view {pr_number} --comments

# Command 2: Get line-by-line comments (CRITICAL - often missed)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments
```

**WARNING**: Skipping Command 2 will cause you to miss important code-level feedback and bugs.

## PR Comment Response Rules

### ✅ CORRECT: Reply to specific comments
```bash
# Reply to a specific comment (use the comment ID from API response)
gh api repos/{owner}/{repo}/pulls/5/comments --method POST \
  --field body="Your reply message here" \
  --field in_reply_to={comment_id}
```

### ❌ WRONG: These commands will EDIT/OVERWRITE existing comments
```bash
# DO NOT USE - This edits existing comments (overwrites original)
gh api repos/{owner}/{repo}/pulls/comments/{comment_id} --method POST --field body="..."
```

### ❌ WRONG: These commands post to PR body (not specific comments)
```bash
# DO NOT USE - This posts to PR body, not as reply to specific comment
gh pr comment {pr_number} --body="..."

# DO NOT USE - This also posts to PR body, not specific line comments
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --method POST --field body="..."
```

**Problem**: PR body comments don't show relationship to specific code issues and make it unclear which comments have been addressed.

### Response Requirements
1. **Reply to EVERY comment** (including nitpicks)
2. **Include commit IDs** for fixes: `Fixed in commit [abc123](link)`
3. **Mark status clearly**: "Fixed", "Won't implement", "Acknowledged"
4. **Use in_reply_to** for direct comment replies

## Important Documentation
- All critical procedures are documented directly in this file

## Development Guidelines
When working on this project:
1. **FIRST**: Execute the two PR review commands above
2. Use TodoWrite tool to track comment responses
3. Reply to ALL comments (including nitpicks) with clear status

## Code Quality Rules
**MANDATORY**: Run linting before any commit:
- After implementing code: `npm run check-all` (lint:fix + format + typecheck)
- **Before final commit**: `npm run check-ci` (CI-equivalent strict check)
- Pre-commit hook automatically runs `lint-staged` on staged files
- Never commit without passing both checks

Available commands:
- `npm run check-all` - Development check (auto-fixes issues)
- `npm run check-ci` - **CI-equivalent strict check (no auto-fix)**
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format with Prettier
- `npm run typecheck` - TypeScript type checking

**Workflow**:
1. Development: `npm run check-all` (fixes issues automatically)
2. Pre-commit: `npm run check-ci` (ensures CI compatibility)