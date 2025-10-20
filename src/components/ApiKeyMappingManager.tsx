'use client';

import { useState } from 'react';
import { Plus, X, Save, Trash2, Key } from 'lucide-react';

interface ApiKeyMapping {
  [key: string]: string;
}

export default function ApiKeyMappingManager() {
  const [showForm, setShowForm] = useState(false);
  const [apiKeyId, setApiKeyId] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mappings, setMappings] = useState<ApiKeyMapping>({});
  const [showMappings, setShowMappings] = useState(false);

  const loadMappings = async () => {
    try {
      const response = await fetch('/api/mappings');
      if (response.ok) {
        const data = await response.json() as ApiKeyMapping;
        setMappings(data);
      }
    } catch (err) {
      console.error('Failed to load mappings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeyId, userName }),
      });

      const data = await response.json() as { error?: string; success?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add mapping');
      }

      setSuccess(`Successfully added mapping: ${apiKeyId} → ${userName}`);
      setApiKeyId('');
      setUserName('');
      setShowForm(false);

      // Reload mappings if they're being displayed
      if (showMappings) {
        await loadMappings();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add mapping');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm(`Are you sure you want to delete the mapping for ${keyId}?`)) {
      return;
    }

    try {
      const response = await fetch('/api/mappings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKeyId: keyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete mapping');
      }

      await loadMappings();
      setSuccess(`Successfully deleted mapping for ${keyId}`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete mapping');
    }
  };

  const toggleMappings = async () => {
    if (!showMappings) {
      await loadMappings();
    }
    setShowMappings(!showMappings);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">API Key Mappings</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleMappings}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors text-sm"
          >
            {showMappings ? 'Hide' : 'View'} Mappings
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Add Mapping'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-200 text-sm">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Add Mapping Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="apiKeyId" className="block text-sm font-medium text-gray-300 mb-2">
                API Key ID
              </label>
              <input
                type="text"
                id="apiKeyId"
                value={apiKeyId}
                onChange={(e) => setApiKeyId(e.target.value)}
                placeholder="key_UlNZ6qS2brN8b3UX"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">Must start with &quot;key_&quot;</p>
            </div>
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-300 mb-2">
                User Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Mapping'}
            </button>
          </div>
        </form>
      )}

      {/* View Mappings */}
      {showMappings && (
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 mt-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Current Mappings</h3>
          {Object.keys(mappings).length === 0 ? (
            <p className="text-gray-500 text-sm">No mappings found</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(mappings).map(([keyId, name]) => (
                <div
                  key={keyId}
                  className="flex justify-between items-center bg-gray-800 rounded-lg p-3 border border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-blue-400">{name}</p>
                    <p className="text-xs text-gray-500">{keyId}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(keyId)}
                    className="p-2 hover:bg-red-900/50 rounded-lg transition-colors text-red-400 hover:text-red-300"
                    title="Delete mapping"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
