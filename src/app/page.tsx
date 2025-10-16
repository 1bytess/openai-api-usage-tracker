'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle, TrendingUp, Activity, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUserName } from '@/lib/apiKeys';

// TypeScript interfaces
interface UsageResult {
  api_key_id?: string;
  input_tokens?: number;
  output_tokens?: number;
  input_cached_tokens?: number;
  num_model_requests?: number;
  input_audio_tokens?: number;
  output_audio_tokens?: number;
  model?: string;
}

interface UsageBucket {
  results?: UsageResult[];
}

interface TierUsage {
  used: number;
  limit: number;
  models: Record<string, number>;
}

export default function Home() {
  const [usageData, setUsageData] = useState<UsageBucket[]>([]);
  const [modelData, setModelData] = useState<UsageBucket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Default to today's date
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    const today = new Date(getTodayDate());
    if (date < today) {
      date.setDate(date.getDate() + 1);
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  // Calendar functions
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDatePicker(false);
  };

  const renderCalendar = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month - 1);
    const firstDay = getFirstDayOfMonth(year, month - 1);
    const todayStr = getTodayDate();

    const days = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }

    // Add days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = d === day;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      days.push(
        <button
          key={d}
          onClick={() => !isFuture && handleDateSelect(dateStr)}
          disabled={isFuture}
          className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors
            ${isSelected ? 'bg-blue-600 text-white' : ''}
            ${!isSelected && isToday ? 'bg-gray-700 text-blue-400' : ''}
            ${!isSelected && !isToday && !isFuture ? 'hover:bg-gray-700 text-gray-300' : ''}
            ${isFuture ? 'text-gray-600 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {d}
        </button>
      );
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const newDate = new Date(year, month - 1 + (direction === 'prev' ? -1 : 1), 1);
    const newYear = newDate.getFullYear();
    const newMonth = newDate.getMonth() + 1;

    // Get max days in the new month
    const daysInNewMonth = getDaysInMonth(newYear, newMonth - 1);
    const validDay = Math.min(day, daysInNewMonth);

    // Don't allow navigating to future months
    const newDateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-01`;
    if (newDateStr <= getTodayDate()) {
      const finalDateStr = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`;
      // Also check if the final date is not in the future
      if (finalDateStr <= getTodayDate()) {
        setSelectedDate(finalDateStr);
      } else {
        // If the calculated date is in the future, set to today
        setSelectedDate(getTodayDate());
      }
    }
  };

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);

    try {
      // Parse selected date and get start/end times for that day
      const date = new Date(selectedDate);
      const startTime = Math.floor(date.setHours(0, 0, 0, 0) / 1000);
      const endTime = Math.floor(date.setHours(23, 59, 59, 999) / 1000);

      // Fetch data grouped by API key (for user tracking)
      const userResponse = await fetch(`/api/usage?start_time=${startTime}&end_time=${endTime}`);
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user usage data');
      }
      const userData = await userResponse.json();
      setUsageData(userData.data || []);

      // Fetch data grouped by model (for tier tracking and model breakdown)
      const modelResponse = await fetch(`/api/usage?start_time=${startTime}&end_time=${endTime}&group_by=model`);
      if (!modelResponse.ok) {
        throw new Error('Failed to fetch model usage data');
      }
      const modelDataResponse = await modelResponse.json();
      setModelData(modelDataResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  const calculateTotals = () => {
    const totals = {
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      requests: 0,
      totalTokens: 0
    };

    usageData.forEach(bucket => {
      bucket.results?.forEach(result => {
        totals.inputTokens += result.input_tokens || 0;
        totals.outputTokens += result.output_tokens || 0;
        totals.cachedTokens += result.input_cached_tokens || 0;
        totals.requests += result.num_model_requests || 0;
      });
    });

    totals.totalTokens = totals.inputTokens + totals.outputTokens;
    return totals;
  };

  const getModelTierUsage = (): { nano_mini: TierUsage; base_pro: TierUsage } => {
    const tierUsage = {
      nano_mini: { used: 0, limit: 1000000, models: {} as Record<string, number> },
      base_pro: { used: 0, limit: 250000, models: {} as Record<string, number> }
    };

    // Use modelData (grouped by model) for tier usage calculation
    modelData.forEach(bucket => {
      bucket.results?.forEach(result => {
        const model = result.model || 'unknown';
        const tokens = (result.input_tokens || 0) + (result.output_tokens || 0);

        // Categorize by model tier based on OpenAI's free tier limits
        // Mini/Nano Tier (2.5M tokens/day): gpt-5-mini, gpt-5-nano, gpt-4.1-mini, gpt-4.1-nano,
        //                                     gpt-4o-mini, o1-mini, o3-mini, o4-mini, codex-mini-latest
        // Base/Pro Tier (250K tokens/day): gpt-5, gpt-5-codex, gpt-5-chat-latest, gpt-4.1, gpt-4o, o1, o3

        const isMiniNano = model.includes('mini') ||
                           model.includes('nano') ||
                           model.includes('codex-mini');

        const isBasePro = model.includes('gpt-5') && !model.includes('mini') && !model.includes('nano') ||
                          model.includes('gpt-5-codex') ||
                          model.includes('gpt-5-chat-latest') ||
                          model.includes('gpt-4.1') && !model.includes('mini') && !model.includes('nano') ||
                          model.includes('gpt-4o') && !model.includes('mini') ||
                          (model.includes('o1') && !model.includes('mini')) ||
                          (model.includes('o3') && !model.includes('mini'));

        if (isMiniNano) {
          tierUsage.nano_mini.used += tokens;
          tierUsage.nano_mini.models[model] = (tierUsage.nano_mini.models[model] || 0) + tokens;
        } else if (isBasePro) {
          tierUsage.base_pro.used += tokens;
          tierUsage.base_pro.models[model] = (tierUsage.base_pro.models[model] || 0) + tokens;
        } else if (model !== 'unknown') {
          // Unknown models default to Base/Pro (more restrictive)
          tierUsage.base_pro.used += tokens;
          tierUsage.base_pro.models[model] = (tierUsage.base_pro.models[model] || 0) + tokens;
        }
      });
    });

    return tierUsage;
  };

  const totals = calculateTotals();
  const tierUsage = getModelTierUsage();

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPercentage = (used: number, limit: number): string => {
    return ((used / limit) * 100).toFixed(2);
  };

  const getProgressColor = (percentage: string): string => {
    const pct = parseFloat(percentage);
    if (pct < 50) return 'bg-green-500';
    if (pct < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Controls */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              OpenAI API Usage Tracker
            </h1>
            <p className="text-gray-400 text-sm lg:text-base">Monitor OpenAI API Usage and free credit limits</p>
          </div>

          {/* Controls on the right */}
          <div className="flex flex-wrap gap-2 lg:gap-3 items-center">
            {/* Previous Day */}
            <button
              onClick={goToPreviousDay}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
              title="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Date Picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors min-w-[200px]"
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </button>

              {/* Custom Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full mt-2 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50 min-w-[320px]">
                  {/* Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold text-lg">
                      {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                    </h3>
                    <button
                      onClick={() => navigateMonth('next')}
                      disabled={selectedDate.substring(0, 7) >= getTodayDate().substring(0, 7)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Labels */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                  </div>

                  {/* Today Button */}
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <button
                      onClick={() => {
                        goToToday();
                        setShowDatePicker(false);
                      }}
                      disabled={selectedDate === getTodayDate()}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Today
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Next Day */}
            <button
              onClick={goToNextDay}
              disabled={selectedDate === getTodayDate()}
              className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Today Button */}
            <button
              onClick={goToToday}
              disabled={selectedDate === getTodayDate()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Today
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchUsage}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200">{error}</span>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Total Tokens</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totals.totalTokens)}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Input Tokens</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totals.inputTokens)}</p>
            <p className="text-sm text-gray-500">Cached: {formatNumber(totals.cachedTokens)}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">Output Tokens</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totals.outputTokens)}</p>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-400 text-sm">API Requests</h3>
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-bold">{formatNumber(totals.requests)}</p>
          </div>
        </div>

        {/* Model Tier Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Nano/Mini Tier */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-green-400">Mini/Nano Tier (Free 1M Tokens/Day)</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Usage</span>
                <span className="font-semibold">
                  {formatNumber(tierUsage.nano_mini.used)} / {formatNumber(tierUsage.nano_mini.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor(getPercentage(tierUsage.nano_mini.used, tierUsage.nano_mini.limit))}`}
                  style={{ width: `${Math.min(parseFloat(getPercentage(tierUsage.nano_mini.used, tierUsage.nano_mini.limit)), 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getPercentage(tierUsage.nano_mini.used, tierUsage.nano_mini.limit)}% used
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-400">Model Breakdown:</h4>
              {Object.entries(tierUsage.nano_mini.models).map(([model, tokens]) => (
                <div key={model} className="flex justify-between text-sm">
                  <span className="text-gray-300">{model}</span>
                  <span className="text-gray-400">{formatNumber(tokens)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Base/Pro Tier */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Base/Pro Tier (Free 250K Tokens/Day)</h3>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Usage</span>
                <span className="font-semibold">
                  {formatNumber(tierUsage.base_pro.used)} / {formatNumber(tierUsage.base_pro.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressColor(getPercentage(tierUsage.base_pro.used, tierUsage.base_pro.limit))}`}
                  style={{ width: `${Math.min(parseFloat(getPercentage(tierUsage.base_pro.used, tierUsage.base_pro.limit)), 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {getPercentage(tierUsage.base_pro.used, tierUsage.base_pro.limit)}% used
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-400">Model Breakdown:</h4>
              {Object.entries(tierUsage.base_pro.models).map(([model, tokens]) => (
                <div key={model} className="flex justify-between text-sm">
                  <span className="text-gray-300">{model}</span>
                  <span className="text-gray-400">{formatNumber(tokens)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage by User */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 lg:p-8">
          <h3 className="text-xl lg:text-2xl font-semibold mb-6">Usage by User</h3>

          {usageData.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No usage data found</p>
          ) : (
            <div className="space-y-4">
              {usageData.map((bucket, bucketIndex) => (
                <div key={bucketIndex} className="space-y-4">
                  {bucket.results?.map((result, idx) => {
                    const apiKeyId = result.api_key_id || 'unknown';
                    const userName = getUserName(apiKeyId);
                    const totalTokens = (result.input_tokens || 0) + (result.output_tokens || 0);

                    return (
                      <div key={idx} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 lg:p-6 hover:border-gray-600 transition-colors">
                        <div className="mb-4">
                          <h4 className="text-lg lg:text-xl font-semibold text-blue-400 mb-1">{userName}</h4>
                          <p className="text-xs text-gray-500">API ID: {apiKeyId}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Tokens</p>
                            <p className="text-blue-400 font-bold text-lg lg:text-xl">{formatNumber(totalTokens)}</p>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Input Tokens</p>
                            <p className="text-green-400 font-bold text-lg lg:text-xl">{formatNumber(result.input_tokens || 0)}</p>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Output Tokens</p>
                            <p className="text-purple-400 font-bold text-lg lg:text-xl">{formatNumber(result.output_tokens || 0)}</p>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Requests</p>
                            <p className="text-orange-400 font-bold text-lg lg:text-xl">{result.num_model_requests || 0}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
