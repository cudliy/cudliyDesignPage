import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiService } from '../services/api';
import type { UsageLimits } from '../services/api';

interface SubscriptionState {
  usageLimits: UsageLimits | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  setUsageLimits: (limits: UsageLimits) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkLimits: (userId: string, force?: boolean) => Promise<void>;
  reset: () => void;
}

const DEFAULT_FREE_LIMITS: UsageLimits = {
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
};

// Cache duration: 10 seconds (shorter to ensure fresher data)
const CACHE_DURATION = 10 * 1000;

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      usageLimits: null,
      loading: false,
      error: null,
      lastFetched: null,

      setUsageLimits: (limits) => set({ usageLimits: limits, lastFetched: Date.now() }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),

      checkLimits: async (userId: string, force = false) => {
        if (!userId) {
          console.log('⚠️ No userId provided to checkLimits');
          return;
        }

        const state = get();
        
        // Use cache if available and recent (unless forced)
        if (!force && state.usageLimits && state.lastFetched) {
          const cacheAge = Date.now() - state.lastFetched;
          if (cacheAge < CACHE_DURATION) {
            console.log('📦 Using cached subscription data (age:', cacheAge, 'ms)', state.usageLimits);
            return;
          }
        }

        try {
          set({ loading: true, error: null });
          console.log('🔄 Fetching fresh subscription data for user:', userId, force ? '(FORCED)' : '(normal)');

          const response = await apiService.checkUsageLimits(userId);
          console.log('📡 API Response:', response);

          if (response.success && response.data) {
            console.log('✅ Subscription data received:', {
              plan: response.data.plan,
              limits: response.data.limits,
              usage: response.data.usage,
              remaining: response.data.remaining,
              subscription: response.data.subscription
            });
            
            set({ 
              usageLimits: response.data, 
              loading: false,
              error: null,
              lastFetched: Date.now()
            });
            
            console.log('💾 Subscription data saved to Zustand store');
          } else {
            throw new Error(response.error || 'Failed to check usage limits');
          }
        } catch (err) {
          console.error('❌ Error checking usage limits:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to check usage limits';
          
          // Set default free limits on error (but keep existing data if available)
          if (!state.usageLimits) {
            console.log('⚠️ Setting default free limits due to error');
            set({
              usageLimits: DEFAULT_FREE_LIMITS,
              error: errorMessage,
              loading: false,
              lastFetched: Date.now()
            });
          } else {
            console.log('⚠️ Keeping existing subscription data due to error');
            set({
              error: errorMessage,
              loading: false
            });
          }
        }
      },

      reset: () => set({
        usageLimits: null,
        loading: false,
        error: null,
        lastFetched: null
      })
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        usageLimits: state.usageLimits,
        lastFetched: state.lastFetched
      })
    }
  )
);

// Computed selectors for convenience
export const useCanGenerateImages = () => {
  const usageLimits = useSubscriptionStore((state) => state.usageLimits);
  
  if (!usageLimits) return true; // Default to true if limits not loaded
  
  return usageLimits.remaining.images > 0 || usageLimits.limits.imagesPerMonth === -1;
};

export const useCanGenerateModels = () => {
  const usageLimits = useSubscriptionStore((state) => state.usageLimits);
  
  if (!usageLimits) return true; // Default to true if limits not loaded
  
  return usageLimits.remaining.models > 0 || usageLimits.limits.modelsPerMonth === -1;
};

export const useRemainingImages = () => {
  const usageLimits = useSubscriptionStore((state) => state.usageLimits);
  return usageLimits?.remaining.images || 0;
};

export const useRemainingModels = () => {
  const usageLimits = useSubscriptionStore((state) => state.usageLimits);
  return usageLimits?.remaining.models || 0;
};

