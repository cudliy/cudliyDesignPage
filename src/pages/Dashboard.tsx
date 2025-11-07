import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Design } from '../services/api';
import { useUsageLimits } from '../hooks/useUsageLimits';
import SubscriptionDebug from '../components/SubscriptionDebug';
import SEO from '@/components/SEO';


export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'recent' | 'all' | 'orders' | 'trash' | 'tutorial' | 'community' | 'credits' | 'upgrade' | 'edu'>('recent');
  const [expandedDesigns, setExpandedDesigns] = useState<Set<string>>(new Set());
  const [userId] = useState(() => {
    const userId = sessionStorage.getItem('user_id');
    const token = sessionStorage.getItem('token');
    if (!userId || !token) {
      // Redirect to login if not authenticated
      window.location.href = '/signin';
    }
    return userId;
  });

  const userName = useMemo(() => sessionStorage.getItem('user_name') || '', []);
  const userFirstName = useMemo(() => sessionStorage.getItem('user_firstName') || '', []);
  const userLastName = useMemo(() => sessionStorage.getItem('user_lastName') || '', []);
  const displayName = useMemo(() => {
    // Use firstName and lastName if available, otherwise fall back to username
    if (userFirstName && userLastName) {
      return `${userFirstName} ${userLastName}`;
    }
    return userName;
  }, [userFirstName, userLastName, userName]);
  const userInitials = useMemo(() => {
    // Use firstName and lastName if available, otherwise fall back to username/email
    if (userFirstName && userLastName) {
      return (userFirstName[0] + userLastName[0]).toUpperCase();
    }
    
    const source = userName || userId || '';
    if (!source) return 'GU';
    let namePart = source;
    if (source.includes('@')) namePart = source.split('@')[0];
    const parts = namePart.replace(/[_.-]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'GU';
    const first = parts[0]?.[0] || '';
    const last = (parts.length > 1 ? parts[parts.length - 1] : parts[0])?.[0] || '';
    return (first + last).toUpperCase();
  }, [userFirstName, userLastName, userName, userId]);

  // Usage limits and subscription status
  const { 
    usageLimits, 
    canGenerateImages, 
    canGenerateModels, 
    remainingImages, 
    remainingModels,
    checkLimits 
  } = useUsageLimits(userId || '');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const fetchDesigns = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (!userId) {
        setDesigns([]);
        setError(null);
        return;
      }
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });
      
      const apiPromise = apiService.getUserDesigns(userId, 1, 50);
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      if (response.success && response.data) {
        const fetchedDesigns = response.data.designs || [];
        setDesigns(fetchedDesigns);
        setError(null);
        
        // Store in sessionStorage as cache (optional)
        if (fetchedDesigns.length > 0) {
          sessionStorage.setItem('cached_designs', JSON.stringify(fetchedDesigns));
          sessionStorage.setItem('cached_designs_timestamp', Date.now().toString());
        }
      } else {
        throw new Error(response.error || 'Failed to fetch designs');
      }
    } catch (err) {
      // If it's a network error or backend is not available, try to load from cache
      if (err instanceof Error && (err.message.includes('timeout') || err.message.includes('Failed to fetch') || err.message.includes('Network'))) {
        // Try to load from cache if available and recent (less than 5 minutes old)
        const cachedDesigns = sessionStorage.getItem('cached_designs');
        const cachedTimestamp = sessionStorage.getItem('cached_designs_timestamp');
        
        if (cachedDesigns && cachedTimestamp) {
          const cacheAge = Date.now() - parseInt(cachedTimestamp);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes
            setDesigns(JSON.parse(cachedDesigns));
            setError(null);
            return;
          }
        }
        
        setDesigns([]);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch designs');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDesigns();
    }
  }, [userId]);

  // Handle Stripe checkout success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId && userId) {
      // Clear any cached subscription data to ensure fresh fetch
      sessionStorage.removeItem('subscription-storage');
      
      // Poll for subscription creation (webhook might take time)
      const pollForSubscription = async (retries = 15) => {
        try {
          // Fetch fresh subscriptions data
          const subscriptionResponse = await apiService.getUserSubscriptions(userId);
          
          // Also check usage limits which includes subscription info
          const limitsResponse = await apiService.checkUsageLimits(userId);
          
          // Check both responses for subscription
          const hasActiveSubscription = 
            (subscriptionResponse.success && subscriptionResponse.data?.subscriptions?.some(
              (sub: any) => sub.status === 'active' || sub.status === 'trialing'
            )) ||
            (limitsResponse.success && limitsResponse.data?.plan !== 'free');
          
          if (hasActiveSubscription) {
            // Force refresh usage limits (bypasses cache)
            await checkLimits(true); // Force refresh
            
            // Remove session_id from URL (no page reload needed - Zustand handles state)
            window.history.replaceState({}, document.title, '/dashboard');
            return;
          }
          
          // If no active subscription found and retries left, try again
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 4000));
            await pollForSubscription(retries - 1);
          } else {
            // Try manual sync as fallback
            try {
              const syncResponse = await apiService.syncSubscription(userId, sessionId);
              
              if (syncResponse.success) {
                await checkLimits(true);
                window.history.replaceState({}, document.title, '/dashboard');
                alert('Subscription activated successfully!');
                return;
              }
            } catch (syncError) {
              // Sync failed, continue
            }
            
            // If manual sync also failed
            window.history.replaceState({}, document.title, '/dashboard');
            await checkLimits(true);
            
            alert('Subscription payment received! The system is still processing your subscription. Please refresh the page in a few moments to see your updated plan.');
          }
        } catch (error) {
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            await pollForSubscription(retries - 1);
          } else {
            // Remove session_id on final failure
            window.history.replaceState({}, document.title, '/dashboard');
            await checkLimits(true); // Force refresh anyway
          }
        }
      };
      
      // Start polling with a delay to allow webhook to process
      setTimeout(() => pollForSubscription(), 5000);
    }
  }, [userId, checkLimits]);

  // Auto-refresh every 60 seconds (only if user is on recent/all view)
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      if (currentView === 'recent' || currentView === 'all') {
        fetchDesigns(true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userId, currentView]);

  const handleDesignClick = (designId: string) => {
    navigate(`/design/${designId}`);
  };

  const toggleDesignExpansion = (designId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedDesigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(designId)) {
        newSet.delete(designId);
      } else {
        newSet.add(designId);
      }
      return newSet;
    });
  };

  const navigationItems = {
    explore: [
      { name: 'Tutorial', icon: '', key: 'tutorial' as const },
      { name: 'Community', icon: '', key: 'community' as const }
    ],
    creations: [
      { name: 'Recent', icon: '', key: 'recent' as const },
      { name: 'All Files', icon: '', key: 'all' as const },
      { name: 'Order history', icon: '', key: 'orders' as const },
      { name: 'Trash', icon: '', key: 'trash' as const }
    ],
    subscription: [
      { name: 'Credit balance', icon: '', key: 'credits' as const },
      { name: 'Upgrade to Pro', icon: '', key: 'upgrade' as const },
      { name: 'EDU License', icon: '', key: 'edu' as const }
    ]
  };

  // Helper function to get design image
  const getDesignImage = (design: Design) => {
    if (design.images && design.images.length > 0) {
      return design.images[0].url;
    }
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
  };

  // Helper function to get design title
  const getDesignTitle = (design: Design) => {
    return design.originalText || 'Untitled Design';
  };

  // Helper function to get truncated title
  const getTruncatedTitle = (design: Design) => {
    const title = design.originalText || 'Untitled Design';
    const words = title.split(',');
    if (words.length > 0) {
      const firstPart = words[0].trim();
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1) + '...';
    }
    return title;
  };

  // Helper function to get full title
  const getFullTitle = (design: Design) => {
    const title = design.originalText || 'Untitled Design';
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  // Helper function to get design category
  const getDesignCategory = (design: Design) => {
    if (design.userSelections?.style) {
      return `${design.userSelections.style} Design`;
    }
    return '3D Design';
  };

  // Helper function to get border color based on design
  const getBorderColor = (design: Design) => {
    const colors = ['border-pink-300', 'border-gray-300', 'border-purple-300', 'border-teal-300', 'border-blue-300', 'border-green-300'];
    const hash = design.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile View
  if (isMobile) {

    return (
      <>
        <SEO 
          title="Dashboard - Manage Your Toy Designs"
          description="Access your personal dashboard to view, manage, and organize your custom toy designs. Track your creations and continue your creative journey."
          keywords="dashboard, my designs, toy management, design gallery, user dashboard, creative workspace"
          url="/dashboard"
        />
        <div className="w-screen h-screen bg-gray-50 flex flex-col">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-3 flex items-center justify-between shadow-lg z-20">
            <div className="flex items-center gap-3">
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img src='/Asset 13.svg' className='w-6 h-6' alt="Logo" />
              <h1 className="text-base font-semibold truncate">{displayName}'s Workspace</h1>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userInitials}
            </div>
          </div>

          {/* Slide-out Menu */}
          {showMobileMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 z-30 transition-opacity"
                onClick={() => setShowMobileMenu(false)}
              />
              
              {/* Menu Panel */}
              <div className="fixed top-0 left-0 bottom-0 w-80 bg-[#313131] z-40 shadow-2xl transform transition-transform duration-300 ease-out overflow-y-auto scrollbar-hide" style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                {/* Menu Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src='/Asset 13.svg' className='w-8 h-8' alt="Logo" />
                    <span className="text-white font-semibold text-lg">Menu</span>
                  </div>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Menu Content */}
                <div className="p-6 space-y-6">
                  {/* Explore Section */}
                  <div>
                    <h3 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wider">Explore</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('tutorial');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'tutorial'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-sm font-medium">Tutorial</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('community');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'community'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium">Community</span>
                      </button>
                    </div>
                  </div>

                  {/* My Creations Section */}
                  <div>
                    <h3 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wider">My Creations</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('recent');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'recent'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Recent</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('all');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'all'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="text-sm font-medium">All Files</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('orders');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'orders'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <span className="text-sm font-medium">Order History</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('trash');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'trash'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm font-medium">Trash</span>
                      </button>
                    </div>
                  </div>

                  {/* Subscription Section */}
                  <div>
                    <h3 className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wider">Subscription</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setCurrentView('credits');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'credits'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">Credit Balance</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate('/pricing');
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-orange-500 text-white"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-sm font-medium">Upgrade to Pro</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentView('edu');
                          setShowMobileMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          currentView === 'edu'
                            ? 'bg-white/10 text-white'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        <span className="text-sm font-medium">EDU License</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Usage Limits Banner */}
          {usageLimits && (!canGenerateImages || !canGenerateModels) && (
            <div className="mx-4 mt-3 mb-2">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-red-800">Limit Reached</h3>
                      <p className="text-xs text-red-600">
                        {!canGenerateImages && `Images: ${remainingImages}/${usageLimits.limits.imagesPerMonth === -1 ? '∞' : usageLimits.limits.imagesPerMonth}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-3 py-1 bg-[#FF9CB5] text-white text-xs font-medium rounded-lg"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* New Design Button */}
            <button 
              onClick={() => navigate('/design')}
              disabled={!canGenerateImages && !canGenerateModels}
              className={`w-full mb-4 px-6 py-3 rounded-full font-medium transition-all ${
                !canGenerateImages && !canGenerateModels
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
              }`}
            >
              + New Design
            </button>



            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search designs..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Content based on view */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
                  <p className="text-sm text-gray-600 mb-4">{error}</p>
                  <button 
                    onClick={() => fetchDesigns(true)}
                    className="px-6 py-2 bg-pink-500 text-white rounded-full"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (currentView === 'recent' || currentView === 'all') && designs.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Designs Yet</h3>
                  <p className="text-sm text-gray-600 mb-4">Start creating your first 3D design!</p>
                </div>
              </div>
            ) : currentView === 'orders' ? (
              <div className="py-12 text-center text-gray-600">
                <p className="text-sm">Order history will appear here.</p>
              </div>
            ) : currentView === 'trash' ? (
              <div className="py-12 text-center text-gray-600">
                <p className="text-sm">Trash is empty.</p>
              </div>
            ) : currentView === 'tutorial' ? (
              <div className="py-12 text-center text-gray-600">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Tutorials</h3>
                  <p className="text-sm text-gray-600">Learn how to create amazing 3D designs.</p>
                </div>
              </div>
            ) : currentView === 'community' ? (
              <div className="py-12 text-center text-gray-600">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Community</h3>
                  <p className="text-sm text-gray-600">Connect with other creators and share your work.</p>
                </div>
              </div>
            ) : currentView === 'credits' ? (
              <div className="py-12 text-center text-gray-600">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Credit Balance</h3>
                  {usageLimits && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Images: {remainingImages}/{usageLimits.limits.imagesPerMonth === -1 ? '∞' : usageLimits.limits.imagesPerMonth}
                      </p>
                      <p className="text-sm text-gray-600">
                        Models: {remainingModels}/{usageLimits.limits.modelsPerMonth === -1 ? '∞' : usageLimits.limits.modelsPerMonth}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : currentView === 'edu' ? (
              <div className="py-12 text-center text-gray-600">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">EDU License</h3>
                  <p className="text-sm text-gray-600 mb-4">Special pricing for educational institutions.</p>
                  <button 
                    onClick={() => window.location.href = 'mailto:sales@cudliy.com?subject=EDU License Inquiry'}
                    className="px-6 py-2 bg-orange-500 text-white rounded-full text-sm"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            ) : (currentView === 'recent' || currentView === 'all') ? (
              <div className="grid grid-cols-2 gap-3">
                {designs.map((design) => (
                  <div
                    key={design.id}
                    onClick={() => handleDesignClick(design.id)}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-3 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                      <img
                        src={getDesignImage(design)}
                        alt={getDesignTitle(design)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-xs font-medium text-gray-800 truncate">{getTruncatedTitle(design)}</h3>
                    <p className="text-xs text-gray-500">{getDesignCategory(design)}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  // Desktop View
  return (
    <>
      <SEO 
        title="Dashboard - Manage Your Toy Designs"
        description="Access your personal dashboard to view, manage, and organize your custom toy designs. Track your creations and continue your creative journey."
        keywords="dashboard, my designs, toy management, design gallery, user dashboard, creative workspace"
        url="/dashboard"
      />
      <div className="w-screen h-screen bg-white flex p-2 sm:p-4 fixed inset-0 overflow-hidden">
      {/* Left Sidebar */}
      <aside className={`h-screen bg-[#313131] border border-white/5 ${
        isLoaded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-8'
      } transition-all duration-500 relative flex-shrink-0`}
      style={{
        width: 'clamp(310px, 27vw, 450px)',
        borderRadius: 'clamp(20px, 4vw, 40px)',
      }}>
        

        {/* Main Sidebar Content */}
        <div className="relative h-full flex flex-col text-white overflow-hidden">
          {/* Title */}
          <div className="px-4 sm:px-6 flex gap-4 lg:px-8 pt-6 sm:pt-8 lg:pt-12 pb-4 sm:pb-6">
           <img src='/Asset 13.svg'
           className='w-[30px] h-[40px]'
           /> <span className='text-white font-abril mt-[10px] '>{displayName}'s Workspace</span>
          </div>

          {/* Navigation Container - Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-12">
            <div className="space-y-2 sm:space-y-2" style={{ marginLeft: 'clamp(60px, 12vw, 144px)' }}>
              {/* Explore Section */}
              <div>
                <h3 className="text-white text-xs font-semibold sm:text-sm mb-1 mt-8 ">Explore</h3>
                <div className="space-y-0.5">
                  {navigationItems.explore.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentView(item.key)}
                      className={`w-[226px] h-[34px] flex items-center gap-2 sm:gap-2 p-1 sm:p-2 text-white hover:text-white hover:bg-white/5 rounded-[30px] transition-all text-left border border-transparent hover:border-white/10 backdrop-blur-sm ${
                        currentView === item.key ? 'bg-white/5 text-white shadow-lg mx-auto' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-normal text-white/80 text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* My Creations Section */}
              <div>
                <h3 className="text-white text-xs sm:text-sm font-semibold mt-9 mb-0">My Creations</h3>
                <div>
                  {navigationItems.creations.map((item, index) => (
                   <button
                      key={index}
                      onClick={() => setCurrentView(item.key)}
                      className={`w-[226px] h-[34px] flex items-center gap-2 sm:gap-2 p-1 sm:p-2 text-white hover:text-white hover:bg-white/5 rounded-[30px] transition-all text-left border border-transparent hover:border-white/10 backdrop-blur-sm ${
                        currentView === item.key ? 'bg-white/5 text-white shadow-lg mx-auto' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-normal text-white/80 text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subscription Section */}
              <div>
                <h3 className="text-white text-xs sm:text-sm font-semibold mt-9 mb-0 tracking-wide">Subscription</h3>
                <div>
                  {navigationItems.subscription.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (item.key === 'upgrade') {
                          navigate('/pricing');
                        } else {
                          setCurrentView(item.key);
                        }
                      }}
                      className={`w-[226px] h-[34px] flex items-center gap-2 sm:gap-2 p-1 sm:p-2 text-white hover:text-white hover:bg-white/5 rounded-[30px] transition-all text-left border border-transparent hover:border-white/10 backdrop-blur-sm ${
                        currentView === item.key ? 'bg-white/5 text-white shadow-lg mx-auto' : ''
                      }`}
                    >
                      <span className="text-sm sm:text-lg opacity-70">{item.icon}</span>
                      <span className="font-normal text-white/80 text-xs sm:text-sm">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-white ml-2 sm:ml-4 border border-gray-200/50 overflow-hidden" 
           style={{ borderRadius: 'clamp(20px, 4vw, 40px)' }}>
        {/* Usage Limits Banner */}
        {usageLimits && (!canGenerateImages || !canGenerateModels) && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 sm:mt-6 lg:mt-8 mb-2">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-800">Usage Limit Reached</h3>
                    <p className="text-xs text-red-600">
                      {!canGenerateImages && `Images: ${remainingImages}/${usageLimits.limits.imagesPerMonth === -1 ? '∞' : usageLimits.limits.imagesPerMonth}`}
                      {!canGenerateImages && !canGenerateModels && ' • '}
                      {!canGenerateModels && `Models: ${remainingModels}/${usageLimits.limits.modelsPerMonth === -1 ? '∞' : usageLimits.limits.modelsPerMonth}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-[#FF9CB5] hover:bg-[#d10c50] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Usage Status Display */}
            {usageLimits && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
                <span className={`px-2 py-1 rounded-full ${
                  usageLimits.plan === 'pro' ? 'bg-black text-white' :
                  usageLimits.plan === 'premium' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                  'bg-gray-100'
                }`}>
                  {usageLimits.plan === 'pro' ? 'Studio Plan' : 
                   usageLimits.plan === 'premium' ? 'Creator Plan' : 
                   'Free Plan'}
                </span>
              
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
            <button 
              onClick={() => navigate('/design')}
              disabled={!canGenerateImages && !canGenerateModels}
              className={`px-2 sm:px-4 lg:px-6 py-2 sm:py-2 lg:py-2 rounded-full font-normal transition-all duration-300 hover:scale-105 text-[16px] sm:text-sm lg:text-sm ${
                !canGenerateImages && !canGenerateModels
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#E91E63] to-[#d81b60] hover:from-[#d81b60] hover:to-[#E91E63] text-white'
              }`}
            >
              New Design
            </button>
          <div className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 bg-[#313131] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shadow-lg">
            {userInitials}
          </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 lg:px-8 pb-2 sm:pb-2 lg:pb-4">
          <div className="flex items-center justify-between mb-2 sm:mb-2 lg:mb-4">
            <h2 className="font-['Georgia'] text-[16px] font-abril font-normal text-black" 
                style={{ fontSize: 'clamp(10px, 3.5vw, 37px)' }}>
              {currentView === 'recent' && 'Recent'}
              {currentView === 'all' && 'All Files'}
              {currentView === 'orders' && 'Order history'}
              {currentView === 'trash' && 'Trash'}
              {currentView === 'tutorial' && 'Tutorial'}
              {currentView === 'community' && 'Community'}
              {currentView === 'credits' && 'Credit balance'}
              {currentView === 'edu' && 'EDU License'}
            </h2>
          </div>

          <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search"
                className="w-[310px] h-[39px] max-w-md sm:max-w-lg px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 border border-gray-200 rounded-full focus:outline-white/5 focus:ring-2 focus:ring-black/8 focus:border-transparent bg-white shadow-sm text-sm sm:text-base lg:text-lg"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => fetchDesigns(true)}
                disabled={refreshing}
                className="px-4 py-2 hover:bg-gray-200 rounded bg-none transition-colors text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-lg hover:shadow-xl hover:scale-105"
                title="Refresh designs"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="black" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E70D57] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your designs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Designs</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white font-medium rounded-full transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (currentView === 'recent' || currentView === 'all') && designs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Designs Yet</h3>
                <p className="text-gray-600 mb-4">Start creating your first 3D design!</p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={() => navigate('/design')}
                    disabled={!canGenerateImages && !canGenerateModels}
                    className={`px-6 py-2 font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${
                      !canGenerateImages && !canGenerateModels
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#E70D57] to-[#d10c50] hover:from-[#d10c50] hover:to-[#E70D57] text-white shadow-[#E70D57]/50'
                    }`}
                  >
                    Create Design
                  </button>
                  <button 
                    onClick={() => fetchDesigns(true)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-full transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          ) : currentView === 'orders' ? (
            <div className="py-12 text-center text-gray-600">
              Order history will appear here.
            </div>
          ) : currentView === 'trash' ? (
            <div className="py-12 text-center text-gray-600">
              Trash is empty.
            </div>
          ) : currentView === 'tutorial' ? (
            <div className="py-12 text-center text-gray-600">
              Tutorial coming soon.
            </div>
          ) : currentView === 'community' ? (
            <div className="py-12 text-center text-gray-600">
              Community features coming soon.
            </div>
          ) : currentView === 'credits' ? (
            <div className="py-12 space-y-8">
              <SubscriptionDebug userId={userId || ''} />
            </div>
          ) : currentView === 'edu' ? (
            <div className="py-12 text-center text-gray-600">
              EDU License information coming soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-6 lg:gap-8 max-w-4xl">
              {designs.map((design, index) => (
                <div
                  key={design.id}
                  onClick={() => handleDesignClick(design.id)}
                  className={`bg-gradient-to-br from-white via-gray-50 to-white border-2 ${getBorderColor(design)} rounded-2xl p-3 sm:p-4 lg:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                    isLoaded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'
                  } relative group cursor-pointer hover:border-black`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="flex justify-end mb-2 sm:mb-3 lg:mb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle menu click
                      }}
                      className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
                    <div className="w-20 h-16 sm:w-16 lg:w-20 xl:w-24 h-12 sm:h-16 lg:h-20 xl:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner relative group-hover:shadow-lg transition-shadow duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <img
                        src={getDesignImage(design)}
                        alt={getDesignTitle(design)}
                        className="w-14 sm:w-16 lg:w-20 xl:w-24 h-14 sm:h-16 lg:h-20 xl:h-24 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 
                      className="font-semibold text-black mb-1 sm:mb-2 cursor-pointer hover:text-black transition-colors" 
                      style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}
                      onClick={(e) => toggleDesignExpansion(design.id, e)}
                    >
                      {expandedDesigns.has(design.id) ? getFullTitle(design) : getTruncatedTitle(design)}
                    </h3>
                    <p className="text-gray-400 font-medium hidden" 
                       style={{ fontSize: 'clamp(10px, 2vw, 14px)' }}>
                      {getDesignCategory(design)}
                    </p>
                    <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {design.likes}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {design.views}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        design.status === 'completed' ? 'bg-green-100 text-green-800' :
                        design.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        design.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {design.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
      
      <style>{`
        /* Prevent page scrolling and hide scrollbars */
        html, body {
          overflow: hidden;
          height: 100vh;
          width: 100vw;
          margin: 0;
          padding: 0;
        }
        
        * {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        
        *::-webkit-scrollbar {
          display: none; /* WebKit */
        }
      `}</style>
    </>
  );
}