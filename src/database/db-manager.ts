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
    this.db = new Database(dbPath);
    this.setupPragmas();
  }

  private setupPragmas(): void {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = 1000000');
    this.db.pragma('temp_store = memory');
    this.db.pragma('mmap_size = 268435456'); // 256MB
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing database schema...');

    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    this.db.exec(schema);

    console.log('Database schema initialized successfully');
    this.isInitialized = true;
  }

  getDatabase(): Database.Database {
    return this.db;
  }

  optimizeDatabase(): void {
    console.log('Optimizing database...');
    this.db.exec('ANALYZE');
    this.db.exec('PRAGMA optimize');
    console.log('Database optimization completed');
  }

  getStats(): {
    fishCount: number;
    commonNameCount: number;
    japaneseNameCount: number;
    englishNameCount: number;
  } {
    const fishCount = this.db
      .prepare('SELECT COUNT(*) as count FROM fish')
      .get() as { count: number };
    const commonNameCount = this.db
      .prepare('SELECT COUNT(*) as count FROM common_names')
      .get() as { count: number };
    const japaneseNameCount = this.db
      .prepare('SELECT COUNT(*) as count FROM common_names WHERE language = ?')
      .get('Japanese') as { count: number };
    const englishNameCount = this.db
      .prepare('SELECT COUNT(*) as count FROM common_names WHERE language = ?')
      .get('English') as { count: number };

    return {
      fishCount: fishCount.count,
      commonNameCount: commonNameCount.count,
      japaneseNameCount: japaneseNameCount.count,
      englishNameCount: englishNameCount.count,
    };
  }

  close(): void {
    this.db.close();
  }
}
