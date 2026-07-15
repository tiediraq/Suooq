import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ombkjglrwehrhlutadwk.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_8v9azuwjuzcd7Y6MVGhtnQ_ssF880Ij';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔌 Supabase Client Initialized with URL:', supabaseUrl);

/**
 * SQL statement for the user to copy-paste in Supabase SQL editor:
 * 
 * create table if not exists app_state (
 *   key text primary key,
 *   value jsonb not null,
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable Read/Write for all (Turn off RLS or add public policy for simplicity in prototyping)
 * alter table app_state enable row level security;
 * drop policy if exists "Allow public read/write" on app_state;
 * create policy "Allow public read/write" on app_state for all using (true) with check (true);
 */

interface DBWithCollection {
  getSchema(): any;
  updateCollection(collection: string, values: any): void;
}

export async function loadFromSupabase(db: any): Promise<boolean> {
  try {
    console.log('🔄 Attempting to fetch initial database state from Supabase table "app_state"...');
    
    const { data, error } = await supabase
      .from('app_state')
      .select('*');

    if (error) {
      // If table doesn't exist, check for common database missing table error messages or codes
      const isMissingTable = error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('schema cache') || 
        error.message.includes('Could not find the table')
      );
      if (isMissingTable) {
        console.warn('⚠️ Supabase table "app_state" does not exist yet. Using local fallback.');
        console.warn('💡 To enable Supabase Cloud Sync, execute this SQL in your Supabase Dashboard SQL Editor:\n');
        console.warn(`
          CREATE TABLE IF NOT EXISTS app_state (
            key text PRIMARY KEY,
            value jsonb NOT NULL,
            updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
          );
          ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
          DROP POLICY IF EXISTS "Allow public read/write" ON app_state;
          CREATE POLICY "Allow public read/write" ON app_state FOR ALL USING (true) WITH CHECK (true);
        `);
        return false;
      }
      throw error;
    }

    if (data && data.length > 0) {
      console.log(`✅ Successfully loaded ${data.length} collections from Supabase!`);
      const schema = db.getSchema();
      for (const row of data) {
        if (row.key && schema[row.key] !== undefined) {
          // Update the database cache in-memory
          schema[row.key] = row.value;
          console.log(`   └─ Loaded collection: "${row.key}"`);
        }
      }
      return true;
    } else {
      console.log('ℹ️ Supabase table "app_state" is empty. Initializing it with local database state...');
      await seedSupabaseFromLocal(db);
      return true;
    }
  } catch (err: any) {
    console.error('❌ Error loading data from Supabase:', err.message || err);
    return false;
  }
}

export async function syncToSupabase(collection: string, value: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert(
        { key: collection, value: value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      // Quietly log error if table doesn't exist, we don't want to spam or crash
      const isMissingTable = error.message && (
        error.message.includes('does not exist') || 
        error.message.includes('schema cache') || 
        error.message.includes('Could not find the table')
      );
      if (isMissingTable) {
        return;
      }
      console.error(`⚠️ Failed to sync collection "${collection}" to Supabase:`, error.message);
    } else {
      console.log(`☁️ Synced collection "${collection}" successfully to Supabase.`);
    }
  } catch (err: any) {
    console.error(`❌ Unexpected error syncing "${collection}" to Supabase:`, err.message || err);
  }
}

async function seedSupabaseFromLocal(db: any): Promise<void> {
  try {
    const schema = db.getSchema();
    const keys = Object.keys(schema);
    console.log(`📤 Seeding ${keys.length} collections to Supabase...`);

    for (const key of keys) {
      const value = schema[key];
      const { error } = await supabase
        .from('app_state')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (error) {
        const isMissingTable = error.message && (
          error.message.includes('does not exist') || 
          error.message.includes('schema cache') || 
          error.message.includes('Could not find the table')
        );
        if (!isMissingTable) {
          console.error(`❌ Failed to seed "${key}" to Supabase:`, error.message);
        }
      } else {
        console.log(`   └─ Seeded collection: "${key}"`);
      }
    }
    console.log('🎉 Supabase database seeding complete!');
  } catch (err: any) {
    console.error('❌ Error seeding Supabase:', err.message || err);
  }
}
