import { useState } from 'react';
import { apiService } from '../services/api';

interface SubscriptionDebugProps {
  userId: string;
}

interface DebugInfo {
  subscriptions?: unknown;
  usageLimits?: unknown;
  cachedData?: unknown;
  error?: string;
  timestamp: string;
}

export default function SubscriptionDebug({ userId }: SubscriptionDebugProps) {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const checkSubscription = async () => {
    setLoading(true);
    try {
      // Check subscriptions
      const subResponse = await apiService.getUserSubscriptions(userId);
      
      // Check usage limits
      const limitsResponse = await apiService.checkUsageLimits(userId);
      
      // Check session storage
      const cachedData = sessionStorage.getItem('subscription-storage');
      
      setDebugInfo({
        subscriptions: subResponse,
        usageLimits: limitsResponse,
        cachedData: cachedData ? JSON.parse(cachedData) : null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    sessionStorage.removeItem('subscription-storage');
    alert('Cache cleared! Refresh the page to reload subscription data.');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Subscription Debug Tool</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={checkSubscription}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Subscription Status'}
        </button>
        
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
        >
          Clear Cache
        </button>
      </div>

      {debugInfo && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Timestamp</h3>
            <p className="text-sm font-mono">{debugInfo.timestamp}</p>
          </div>

          {debugInfo.error ? (
            <div className="bg-red-50 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Error</h3>
              <p className="text-sm text-red-600">{debugInfo.error}</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">User Subscriptions</h3>
                <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                  {JSON.stringify(debugInfo.subscriptions, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Usage Limits</h3>
                <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                  {JSON.stringify(debugInfo.usageLimits, null, 2)}
                </pre>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Cached Data (Session Storage)</h3>
                <pre className="text-xs overflow-auto bg-white p-2 rounded border">
                  {JSON.stringify(debugInfo.cachedData, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
        <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Click "Check Subscription Status" to see current backend data</li>
          <li>If you just made a payment, wait 10-15 seconds and check again</li>
          <li>If subscription shows but UI doesn't update, click "Clear Cache" and refresh</li>
          <li>Check browser console (F12) for detailed logs</li>
          <li>If issues persist, contact support with the debug info above</li>
        </ol>
      </div>
    </div>
  );
}

