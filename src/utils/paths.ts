import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the project root directory from a module's import.meta.url
 * @param metaUrl - The import.meta.url of the calling module
 * @returns The absolute path to the project root directory
 */
export function getProjectRoot(metaUrl: string): string {
  const currentFilePath = fileURLToPath(metaUrl);
  const currentDir = dirname(currentFilePath);

  // Navigate up from the current file location to find project root
  // This works for both source files and compiled files in dist/
  let dir = currentDir;
  while (dir !== dirname(dir)) {
    // Stop at filesystem root
    // Check if we're at project root by looking for known patterns
    if (dir.endsWith('fish-mcp-server')) {
      return dir;
    }
    dir = dirname(dir);
  }

  // Fallback: assume we're in a known structure
  // From src/utils/ or dist/utils/, go up 2 levels
  return resolve(currentDir, '../..');
}

/**
 * Get the database file path
 * @param metaUrl - The import.meta.url of the calling module
 * @returns The absolute path to the fish.db file
 */
export function getDbPath(metaUrl: string): string {
  return resolve(getProjectRoot(metaUrl), 'fish.db');
}
