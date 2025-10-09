import { useEffect, useCallback } from 'react';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import type { UsageLimits } from '../services/api';

interface UseUsageLimitsReturn {
  usageLimits: UsageLimits | null;
  loading: boolean;
  error: string | null;
  checkLimits: (force?: boolean) => Promise<void>;
  canGenerateImages: boolean;
  canGenerateModels: boolean;
  remainingImages: number;
  remainingModels: number;
}

export const useUsageLimits = (userId: string): UseUsageLimitsReturn => {
  const { 
    usageLimits, 
    loading, 
    error, 
    checkLimits: storeCheckLimits 
  } = useSubscriptionStore();

  const checkLimits = useCallback(async (force = false) => {
    if (!userId) return;
    await storeCheckLimits(userId, force);
  }, [userId, storeCheckLimits]);

  useEffect(() => {
    // Always force fetch on mount to ensure fresh data
    if (userId) {
      storeCheckLimits(userId, true);
    }
  }, [userId, storeCheckLimits]);

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
