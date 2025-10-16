// Import API key mappings from JSON file
import apiKeyMappings from './apiKeyMappings.json';

// API Key to Username mapping
export const API_KEY_MAPPINGS: Record<string, string> = apiKeyMappings;

// Helper function to get user name from API key ID
export const getUserName = (apiKeyId?: string): string => {
  return API_KEY_MAPPINGS[apiKeyId || ''] || apiKeyId || 'Unknown User';
};
