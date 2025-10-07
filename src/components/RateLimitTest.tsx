import React, { useState } from 'react';
import { apiService } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';

interface RateLimitTestProps {
  userId: string;
}

const RateLimitTest: React.FC<RateLimitTestProps> = ({ userId }) => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const { 
    usageLimits, 
    canGenerateImages, 
    canGenerateModels, 
    remainingImages, 
    remainingModels,
    checkLimits 
  } = useUsageLimits(userId);

  const runRateLimitTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: string[] = [];
    
    try {
      // Test 1: Check current usage limits
      results.push('🧪 Test 1: Checking current usage limits...');
      results.push(`Current Plan: ${usageLimits?.plan || 'Unknown'}`);
      results.push(`Images Remaining: ${remainingImages}/${usageLimits?.limits.imagesPerMonth === -1 ? '∞' : usageLimits?.limits.imagesPerMonth || 0}`);
      results.push(`Models Remaining: ${remainingModels}/${usageLimits?.limits.modelsPerMonth === -1 ? '∞' : usageLimits?.limits.modelsPerMonth || 0}`);
      results.push(`Can Generate Images: ${canGenerateImages ? '✅ Yes' : '❌ No'}`);
      results.push(`Can Generate Models: ${canGenerateModels ? '✅ Yes' : '❌ No'}`);
      
      // Test 2: Try to track usage (this should work if limits allow)
      results.push('\n🧪 Test 2: Testing usage tracking...');
      try {
        const trackResponse = await apiService.trackUsage(userId, 'image', 1);
        if (trackResponse.success) {
          results.push('✅ Usage tracking successful');
        } else {
          results.push(`❌ Usage tracking failed: ${trackResponse.error}`);
        }
      } catch (error) {
        results.push(`❌ Usage tracking error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Test 3: Check limits again after tracking
      results.push('\n🧪 Test 3: Checking limits after usage tracking...');
      await checkLimits();
      results.push(`Updated Images Remaining: ${remainingImages}`);
      results.push(`Updated Models Remaining: ${remainingModels}`);
      
      // Test 4: Test rate limit enforcement
      results.push('\n🧪 Test 4: Testing rate limit enforcement...');
      if (!canGenerateImages) {
        results.push('✅ Rate limit properly enforced - cannot generate images');
        results.push('💡 User should see upgrade prompt');
      } else {
        results.push('⚠️ Rate limit not yet reached - user can still generate');
      }
      
      if (!canGenerateModels) {
        results.push('✅ Rate limit properly enforced - cannot generate models');
        results.push('💡 User should see upgrade prompt');
      } else {
        results.push('⚠️ Rate limit not yet reached - user can still generate models');
      }
      
      results.push('\n🎯 Summary:');
      results.push(`- Free tier limits: 3 images, 1 model per month`);
      results.push(`- Current usage: ${usageLimits?.usage.imagesGenerated || 0} images, ${usageLimits?.usage.modelsGenerated || 0} models`);
      results.push(`- Rate limits are ${(!canGenerateImages || !canGenerateModels) ? '✅ WORKING' : '⚠️ NOT YET TRIGGERED'}`);
      
    } catch (error) {
      results.push(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Rate Limit Test</h2>
      
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Current Status:</h3>
        <p>Plan: <span className="font-mono">{usageLimits?.plan || 'Loading...'}</span></p>
        <p>Images: <span className="font-mono">{remainingImages}/{usageLimits?.limits.imagesPerMonth === -1 ? '∞' : usageLimits?.limits.imagesPerMonth || 0}</span></p>
        <p>Models: <span className="font-mono">{remainingModels}/{usageLimits?.limits.modelsPerMonth === -1 ? '∞' : usageLimits?.limits.modelsPerMonth || 0}</span></p>
        <p>Can Generate: <span className="font-mono">{canGenerateImages ? 'Images ✅' : 'Images ❌'}, {canGenerateModels ? 'Models ✅' : 'Models ❌'}</span></p>
      </div>
      
      <button
        onClick={runRateLimitTest}
        disabled={isRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running Tests...' : 'Run Rate Limit Test'}
      </button>
      
      {testResults.length > 0 && (
        <div className="mt-6 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm whitespace-pre-line max-h-96 overflow-y-auto">
          {testResults.join('\n')}
        </div>
      )}
    </div>
  );
};

export default RateLimitTest;
