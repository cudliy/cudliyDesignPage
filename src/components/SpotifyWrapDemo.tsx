import { useState } from 'react';
import { Share2 } from 'lucide-react';
import SpotifyWrapShare from './SpotifyWrapShare';

export default function SpotifyWrapDemo() {
  const [showWrap, setShowWrap] = useState(false);

  const handleShare = async (platform: string, _slideIndex: number) => {
    // Simulate share functionality
    const shareText = `🎨 Check out my 3D design journey with Cudliy! From idea to 3D reality in minutes. #Cudliy #3DDesign #AI`;
    const shareUrl = window.location.origin;
    
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
        break;
      default:
        alert(`Sharing on ${platform} - feature coming soon!`);
        return;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Spotify Wrap Demo</h2>
        <p className="text-gray-600 mb-6">
          Test the Spotify Wrapped-style sharing feature for 3D designs
        </p>
        
        <button
          onClick={() => setShowWrap(true)}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-3 text-lg mx-auto"
        >
          <Share2 className="w-6 h-6" />
          Open Design Wrap
        </button>
      </div>

      {showWrap && (
        <SpotifyWrapShare
          designId="demo-design-123"
          userName="Demo User"
          onClose={() => setShowWrap(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}