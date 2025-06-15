# Claude Context

## Project Overview
Fish MCP Server - An MCP server for searching fish information in Japanese, using FishBase data with local SQLite + FTS5 for full-text search.

## ⚠️ CRITICAL: Git Operations - User Permission Required

### Git Command Restrictions
**NEVER execute git commands without explicit user instruction:**

- `git add`
- `git commit` 
- `git push`
- `git merge`
- `git rebase`
- `git reset`
- `git revert`

### Required Workflow
1. **Make code changes** as requested
2. **Run tests** to verify changes work
3. **ASK USER** before any git operations: "Ready to commit these changes?"
4. **WAIT** for explicit user approval before proceeding
5. **Only then** execute git commands if user approves

### Exception 1: Explicit User Commands
Git operations are ONLY allowed when user explicitly requests them with commands like:
- "commit these changes"
- "create a PR"
- "add and commit"
- "push to remote"

### Exception 2: PR Review Response Workflow
When user approves a fix proposal during PR review:
- User says "OK" or "approve" to a proposed fix
- **Automatically execute**: implement fix → commit → push → reply to comment
- Use the existing "Automatic Fix Workflow" described below

### TodoWrite Rules
- **NEVER** add "commit changes" or similar git tasks to TodoWrite
- Focus TodoWrite on code implementation tasks only
- Let user decide when to commit

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

### Required Steps (Execute in this order)
1. **Get PR review comments**: `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments`
2. **Report all comments to user**: List all comments with their IDs and content
3. **Wait for user instructions**: DO NOT reply to any comments without explicit user approval
4. **Reply only when instructed**: 
   ```bash
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --method POST \
     --field body="User-provided reply message" \
     --field in_reply_to={comment_id}
   ```

### ⚠️ CRITICAL: Never Auto-Reply
- **NEVER** reply to comments without explicit user instruction
- **ALWAYS** ask user how to respond to each comment
- **WAIT** for user to provide specific reply text or approve "won't implement" responses

### ⚠️ FORBIDDEN Commands (Never Use)
Do not use these commands (Reason: Posts to PR body or overwrites existing comments)
- `gh pr comment {pr_number} --body="..."`
- `gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --method POST --field body="..."` (without in_reply_to)
- `gh api repos/{owner}/{repo}/pulls/comments/{comment_id} --method POST` (overwrites existing comment)

### Response Requirements (When User Instructs)
1. **Reply to EVERY comment** user requests response to
2. **For fixes**: 
   - Implement the fix
   - Commit with descriptive message
   - Push to remote branch
   - Include commit IDs in reply: `Fixed in commit [abc123](link)`
3. **For non-fixes**: Mark status clearly as "Won't implement" or "Acknowledged" (only when user specifies)
4. **Use in_reply_to** for direct comment replies

### Automatic Fix Workflow
When user requests to fix a specific comment:

Automatically perform:
1. **Implement the fix** based on the CodeRabbit suggestion
2. **Commit changes**: `git commit -m "descriptive message"`
3. **Push to remote**: `git push`
4. **Reply with commit ID**: 
   ```bash
   gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --method POST \
     --field body="Fixed in commit [commit_hash](commit_url). Description of fix." \
     --field in_reply_to={comment_id}
   ```
5. **Handle errors**: If commit/push fails, report the issue to user

This streamlines the fix-commit-push-reply cycle for faster review responses.

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

## Testing Guidelines
**USE Node.js built-in test framework for all tests**

When writing tests:
- Use Node.js built-in test runner (`node:test`) - **NOT jest, vitest, or mocha**
- Use `node:assert/strict` for assertions
- Place test files in `__tests__` directories next to the code being tested
- Name test files with `.test.ts` suffix

**Test structure example**:
```typescript
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

describe('Feature being tested', () => {
  before(() => {
    // Setup
  });

  after(() => {
    // Cleanup
  });

  it('should behave as expected', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    assert.equal(result, 'expected');
  });
});
```

**Running tests**:
- `npm test` - Run all tests
- `npx tsx --test src/path/to/file.test.ts` - Run specific test file

## ⚠️ CRITICAL: MCP Server Development Rules

### Console Output Prohibition
**NEVER add console.log, console.error, console.warn, or console.info to any source code files.**

**Reason**: This is an MCP (Model Context Protocol) server that communicates with Claude Desktop via JSON-RPC over stdin/stdout. Any console output will contaminate the JSON communication stream and cause parsing errors.

**Forbidden patterns**:
```javascript
console.log('Debug message');         // ❌ FORBIDDEN
console.error('Error occurred');      // ❌ FORBIDDEN  
console.warn('Warning message');      // ❌ FORBIDDEN
console.info('Information');          // ❌ FORBIDDEN
```

**Error handling without console output**:
```javascript
// ✅ CORRECT - Silent error handling
try {
  riskyOperation();
} catch (error) {
  return defaultValue; // or throw error for critical failures
}

// ✅ CORRECT - Propagate critical errors
try {
  criticalOperation();
} catch (error) {
  throw new Error(`Operation failed: ${error.message}`);
}
```

**Alternative debugging methods**:
- Use file-based logging if debugging is absolutely necessary
- Use conditional debug flags with file output
- Test components in isolation outside the MCP context

**Files that must never contain console output**:
- `src/mcp/server.ts` (MCP server core)
- `src/services/*.ts` (All service classes)
- `src/database/*.ts` (Database components)
- `src/index.ts` (Main entry point)
- Any TypeScript file in the src/ directory

This rule is enforced to maintain JSON-RPC protocol compatibility with Claude Desktop.