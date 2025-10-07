import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { UsageLimits } from '../services/api';

interface UseUsageLimitsReturn {
  usageLimits: UsageLimits | null;
  loading: boolean;
  error: string | null;
  checkLimits: () => Promise<void>;
  canGenerateImages: boolean;
  canGenerateModels: boolean;
  remainingImages: number;
  remainingModels: number;
}

export const useUsageLimits = (userId: string): UseUsageLimitsReturn => {
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLimits = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.checkUsageLimits(userId);
      
      if (response.success && response.data) {
        setUsageLimits(response.data);
      } else {
        throw new Error(response.error || 'Failed to check usage limits');
      }
    } catch (err) {
      console.error('Error checking usage limits:', err);
      setError(err instanceof Error ? err.message : 'Failed to check usage limits');
      // Set default limits for free users if API fails
      setUsageLimits({
        plan: 'free',
        limits: {
          imagesPerMonth: 3,
          modelsPerMonth: 1,
          storageGB: 1,
          prioritySupport: false,
          customBranding: false,
          apiAccess: false
        },
        usage: {
          imagesGenerated: 0,
          modelsGenerated: 0,
          storageUsed: 0
        },
        remaining: {
          images: 3,
          models: 1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLimits();
  }, [userId]);

  const canGenerateImages = usageLimits ? 
    (usageLimits.remaining.images > 0 || usageLimits.limits.imagesPerMonth === -1) : 
    true; // Default to true if limits not loaded

  const canGenerateModels = usageLimits ? 
    (usageLimits.remaining.models > 0 || usageLimits.limits.modelsPerMonth === -1) : 
    true; // Default to true if limits not loaded

  const remainingImages = usageLimits?.remaining.images || 0;
  const remainingModels = usageLimits?.remaining.models || 0;

  return {
    usageLimits,
    loading,
    error,
    checkLimits,
    canGenerateImages,
    canGenerateModels,
    remainingImages,
    remainingModels
  };
};
