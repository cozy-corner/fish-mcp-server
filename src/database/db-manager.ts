import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class DatabaseManager {
  private db: Database.Database;
  private isInitialized = false;

  constructor(dbPath: string = 'fish.db') {
    if (!dbPath || typeof dbPath !== 'string') {
      throw new Error('Database path must be a non-empty string');
    }
    try {
      this.db = new Database(dbPath);
      this.setupPragmas();
    } catch (error) {
      throw new Error(`Failed to create database connection: ${error}`);
    }
  }

  private setupPragmas(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000000');
    this.db.pragma('temp_store = memory');
    this.db.pragma('mmap_size = 268435456'); // 256MB
  }

  initialize(): void {
    if (this.isInitialized) return;

    console.log('Initializing database schema...');

    try {
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf-8');

      this.db.exec(schema);
    } catch (error) {
      throw new Error(`Failed to initialize database schema: ${error}`);
    }

    console.log('Database schema initialized successfully');
    this.isInitialized = true;
  }

  optimizeDatabase(): void {
    console.log('Optimizing database...');
    try {
      this.db.exec('ANALYZE');
      this.db.exec('PRAGMA optimize');
      console.log('Database optimization completed');
    } catch (error) {
      console.error('Database optimization failed:', error);
      throw new Error(`Database optimization failed: ${error}`);
    }
  }

  getStats(): {
    fishCount: number;
    commonNameCount: number;
    japaneseNameCount: number;
    englishNameCount: number;
  } {
    try {
      const fishCount = this.db
        .prepare('SELECT COUNT(*) as count FROM fish')
        .get() as { count: number };
      const commonNameCount = this.db
        .prepare('SELECT COUNT(*) as count FROM common_names')
        .get() as { count: number };
      const japaneseNameCount = this.db
        .prepare(
          'SELECT COUNT(*) as count FROM common_names WHERE language = ?'
        )
        .get('Japanese') as { count: number };
      const englishNameCount = this.db
        .prepare(
          'SELECT COUNT(*) as count FROM common_names WHERE language = ?'
        )
        .get('English') as { count: number };

      return {
        fishCount: fishCount.count,
        commonNameCount: commonNameCount.count,
        japaneseNameCount: japaneseNameCount.count,
        englishNameCount: englishNameCount.count,
      };
    } catch (error) {
      throw new Error(`Failed to get database statistics: ${error}`);
    }
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  close(): void {
    try {
      this.db.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}
