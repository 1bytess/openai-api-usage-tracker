// Import API key mappings from JSON file (fallback for local development)
import apiKeyMappings from './apiKeyMappings.json';

// In-memory cache for API key mappings
let cachedMappings: Record<string, string> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 seconds cache (reduced for better UX)
let fetchPromise: Promise<Record<string, string>> | null = null;

// Function to fetch API key mappings from the API
async function fetchMappings(forceRefresh = false): Promise<Record<string, string>> {
  try {
    // Skip cache if force refresh
    if (!forceRefresh && cachedMappings && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      return cachedMappings;
    }

    // If a fetch is already in progress, wait for it
    if (fetchPromise && !forceRefresh) {
      return await fetchPromise;
    }

    // Create new fetch promise
    fetchPromise = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch('/api/mappings', {
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json() as Record<string, string>;
          cachedMappings = data;
          lastFetchTime = Date.now();
          return data;
        }
      } catch (error) {
        console.error('Failed to fetch API key mappings:', error);
      } finally {
        fetchPromise = null;
      }

      // Fallback to cached or static JSON file
      return cachedMappings || apiKeyMappings;
    })();

    return await fetchPromise;
  } catch (error) {
    console.error('Failed to fetch API key mappings:', error);
    fetchPromise = null;
  }

  // Fallback to cached or static JSON file
  return cachedMappings || apiKeyMappings;
}

// Force refresh mappings cache (called after adding/deleting mappings)
export async function refreshMappingsCache(): Promise<void> {
  await fetchMappings(true);
}

// Get mappings with caching
export async function getApiKeyMappings(): Promise<Record<string, string>> {
  // Return cached mappings if still valid
  if (cachedMappings && (Date.now() - lastFetchTime) < CACHE_DURATION) {
    return cachedMappings;
  }

  // Fetch fresh mappings
  return await fetchMappings();
}

// Synchronous version for backward compatibility (uses cache or fallback)
export const API_KEY_MAPPINGS: Record<string, string> = apiKeyMappings as Record<string, string>;

// Helper function to get user name from API key ID (synchronous - uses cache)
export const getUserName = (apiKeyId?: string): string => {
  const mappings = cachedMappings || (apiKeyMappings as Record<string, string>);
  return mappings[apiKeyId || ''] || apiKeyId || 'Unknown User';
};

// Initialize cache on client side with better error handling
if (typeof window !== 'undefined') {
  // Pre-populate cache with static mappings immediately
  cachedMappings = apiKeyMappings as Record<string, string>;
  lastFetchTime = Date.now();

  // Then fetch fresh mappings in the background
  fetchMappings().catch((err) => {
    console.warn('Initial mappings fetch failed, using fallback:', err);
  });
}
