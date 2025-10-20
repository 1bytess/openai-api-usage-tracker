/**
 * Migration script to copy API key mappings from JSON file to Cloudflare KV
 *
 * Usage:
 * 1. Make sure you've created the KV namespace and updated wrangler.toml
 * 2. Deploy your application with the KV bindings configured
 * 3. Run this script by visiting: https://your-domain.pages.dev/api/migrate-mappings
 *
 * Alternatively, you can manually add mappings via the UI on the homepage.
 */

import apiKeyMappings from '../src/lib/apiKeyMappings.json';

export async function migrateToKV() {
  try {
    console.log('Starting migration of API key mappings to KV...');
    console.log('Current mappings:', apiKeyMappings);

    const results = [];

    // Add each mapping via the API
    for (const [apiKeyId, userName] of Object.entries(apiKeyMappings)) {
      try {
        const response = await fetch('/api/mappings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKeyId, userName }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(`✓ Migrated: ${apiKeyId} -> ${userName}`);
          results.push({ apiKeyId, userName, status: 'success' });
        } else {
          console.error(`✗ Failed to migrate ${apiKeyId}:`, data.error);
          results.push({ apiKeyId, userName, status: 'failed', error: data.error });
        }
      } catch (err) {
        console.error(`✗ Error migrating ${apiKeyId}:`, err);
        results.push({
          apiKeyId,
          userName,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    console.log('Migration completed!');
    console.log('Results:', results);

    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Export the mappings for reference
export { apiKeyMappings };
