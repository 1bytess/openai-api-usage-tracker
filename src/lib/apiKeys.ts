// Import API key mappings from JSON file (fallback for local development)
import apiKeyMappings from './apiKeyMappings.json';

// In-memory cache for API key mappings
let cachedMappings: Record<string, string> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Function to fetch API key mappings from the API
async function fetchMappings(): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/mappings', {
      cache: 'no-store'
    });

    if (response.ok) {
      const data = await response.json() as Record<string, string>;
      cachedMappings = data;
      lastFetchTime = Date.now();
      return data;
    }
  } catch (error) {
    console.error('Failed to fetch API key mappings:', error);
  }

  // Fallback to static JSON file
  return apiKeyMappings;
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

// Initialize cache on client side
if (typeof window !== 'undefined') {
  fetchMappings();
}
