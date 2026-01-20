/**
 * Database Migration Runner
 * 
 * This script manages database schema migrations for the Hellbender application.
 * It supports running migrations, checking migration status, and rolling back changes.
 * 
 * Usage:
 *   npm run db:migrate        - Run all pending migrations
 *   npm run db:migrate:down   - Rollback the last migration
 *   npm run db:reset          - Drop and recreate all tables
 */

import * as fs from 'fs';
import * as path from 'path';
import { query, initializePool, closePool, getPool } from './connection';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const MIGRATION_LOG_TABLE = 'migrations_log';

/**
 * Migration interface representing a single migration file
 */
interface Migration {
  filename: string;
  name: string;
  up: string;
  down?: string;
}

/**
 * Get list of migration files from the migrations directory
 * 
 * @returns Array of Migration objects sorted by filename (which includes timestamp)
 */
function getMigrationFiles(): Migration[] {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql') && file !== 'migration_log.sql')
    .sort();
  
  return files.map((filename) => {
    const name = filename.replace('.sql', '').replace(/^\d+_/, '');
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf-8');
    
    // Split content into UP and DOWN migrations
    const sections = content.split(/-- DOWN/g);
    const up = sections[0].trim();
    const down = sections[1]?.trim();
    
    return {
      filename,
      name,
      up,
      down,
    };
  });
}

/**
 * Create the migrations log table if it doesn't exist
 * This table tracks which migrations have been applied
 */
async function ensureMigrationLogTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_LOG_TABLE} (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL
    )
  `);
  
  // Create index for faster lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_${MIGRATION_LOG_TABLE}_filename
    ON ${MIGRATION_LOG_TABLE}(filename)
  `);
}

/**
 * Get list of already applied migrations from the log table
 * 
 * @returns Array of filenames of applied migrations
 */
async function getAppliedMigrations(): Promise<string[]> {
  const result = await query<{ filename: string }>(
    `SELECT filename FROM ${MIGRATION_LOG_TABLE} ORDER BY id`
  );
  return result.rows.map((row) => row.filename);
}

/**
 * Calculate MD5 checksum of migration content for integrity verification
 * 
 * @param content Migration SQL content
 * @returns Hex string of the checksum
 */
function calculateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Run a single migration
 * 
 * @param migration The migration to run
 */
async function runMigration(migration: Migration): Promise<void> {
  console.log(`Applying migration: ${migration.name}`);
  
  await query(migration.up);
  
  const checksum = calculateChecksum(migration.up);
  await query(
    `INSERT INTO ${MIGRATION_LOG_TABLE} (migration_name, filename, checksum) VALUES ($1, $2, $3)`,
    [migration.name, migration.filename, checksum]
  );
  
  console.log(`✓ Migration applied: ${migration.name}`);
}

/**
 * Rollback a single migration
 * 
 * @param migration The migration to rollback
 */
async function rollbackMigration(migration: Migration): Promise<void> {
  if (!migration.down) {
    console.warn(`No down migration for: ${migration.name}`);
    return;
  }
  
  console.log(`Rolling back migration: ${migration.name}`);
  
  await query(migration.down);
  await query(
    `DELETE FROM ${MIGRATION_LOG_TABLE} WHERE filename = $1`,
    [migration.filename]
  );
  
  console.log(`✓ Migration rolled back: ${migration.name}`);
}

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  console.log('Starting database migrations...\n');
  
  await initializePool();
  await ensureMigrationLogTable();
  
  const migrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  const pendingMigrations = migrations.filter(
    (m) => !appliedMigrations.includes(m.filename)
  );
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations. Database is up to date.\n');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migration(s):`);
  pendingMigrations.forEach((m) => console.log(`  - ${m.name}`));
  console.log('');
  
  for (const migration of pendingMigrations) {
    try {
      await runMigration(migration);
    } catch (error) {
      console.error(`✗ Failed to apply migration: ${migration.name}`);
      throw error;
    }
  }
  
  console.log(`\n✓ All ${pendingMigrations.length} migration(s) applied successfully!`);
}

/**
 * Rollback the last applied migration
 */
export async function rollbackLastMigration(): Promise<void> {
  console.log('Rolling back last migration...\n');
  
  await initializePool();
  
  const result = await query<{ filename: string; migration_name: string }>(
    `SELECT * FROM ${MIGRATION_LOG_TABLE} ORDER BY id DESC LIMIT 1`
  );
  
  if (result.rows.length === 0) {
    console.log('No migrations to roll back.\n');
    return;
  }
  
  const lastMigration = result.rows[0];
  const migrations = getMigrationFiles();
  const migration = migrations.find((m) => m.filename === lastMigration.filename);
  
  if (!migration) {
    console.error(`Cannot find migration file: ${lastMigration.filename}`);
    return;
  }
  
  await rollbackMigration(migration);
  console.log('\n✓ Migration rolled back successfully!');
}

/**
 * Reset the database - drop all tables and re-run migrations
 * WARNING: This destroys all data!
 */
export async function resetDatabase(): Promise<void> {
  console.log('⚠️  WARNING: This will destroy all data in the database!\n');
  
  await initializePool();
  
  // Drop all tables in reverse order of dependencies
  await query('DROP TABLE IF EXISTS review_comments CASCADE');
  await query('DROP TABLE IF EXISTS review_files CASCADE');
  await query('DROP TABLE IF EXISTS review_sessions CASCADE');
  await query('DROP TABLE IF EXISTS persistent_repositories CASCADE');
  await query(`DROP TABLE IF EXISTS ${MIGRATION_LOG_TABLE} CASCADE`);
  
  console.log('All tables dropped.\n');
  
  // Re-run migrations
  await runMigrations();
}

/**
 * Show migration status - which migrations have been applied
 */
export async function showMigrationStatus(): Promise<void> {
  console.log('Migration Status\n');
  
  await initializePool();
  await ensureMigrationLogTable();
  
  const migrations = getMigrationFiles();
  const appliedMigrations = await getAppliedMigrations();
  
  console.log('Migrations:');
  console.log('-----------');
  
  for (const migration of migrations) {
    const applied = appliedMigrations.includes(migration.filename);
    const status = applied ? '✓ Applied' : '○ Pending';
    console.log(`[${status}] ${migration.name}`);
  }
  
  const pending = migrations.length - appliedMigrations.length;
  console.log(`\nTotal: ${migrations.length} | Applied: ${appliedMigrations.length} | Pending: ${pending}`);
}

// Main execution when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  (async () => {
    try {
      switch (command) {
        case 'down':
          await rollbackLastMigration();
          break;
        case 'reset':
          await resetDatabase();
          break;
        case 'status':
          await showMigrationStatus();
          break;
        default:
          await runMigrations();
      }
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    } finally {
      await closePool();
    }
  })();
}
