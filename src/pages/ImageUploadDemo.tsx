import { useState } from 'react';
import ImageUploadManager from '../components/ImageUploadManager';
import EnhancedSpotifyWrapShare from '../components/EnhancedSpotifyWrapShare';

export default function ImageUploadDemo() {
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [showWrap, setShowWrap] = useState(false);

  const handleImagesChange = (images: any[]) => {
    setUploadedImages(images);
  };

  const handleShare = (selectedImages: any[]) => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to share');
      return;
    }
    
    // Show Spotify wrap for selected images
    setShowWrap(true);
  };

  const handleWrapShare = (platform: string, _slideIndex: number) => {
    const shareText = `🖼️ Check out my amazing image collection! Created with Cudliy #Cudliy #ImageCollection`;
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

  const selectedImages = uploadedImages.filter(img => img.selected);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Image Upload Demo</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Upload and Share Images</h2>
          
          <div className="h-96 border border-gray-300 rounded-lg">
            <ImageUploadManager
              onImagesChange={handleImagesChange}
              onShare={handleShare}
              maxImages={5}
            />
          </div>
          
          {uploadedImages.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Upload Summary:</h3>
              <p>Total images: {uploadedImages.length}</p>
              <p>Selected images: {selectedImages.length}</p>
              
              {selectedImages.length > 0 && (
                <button
                  onClick={() => setShowWrap(true)}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Preview Spotify Wrap Style
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showWrap && selectedImages.length > 0 && (
        <EnhancedSpotifyWrapShare
          imageData={{
            type: 'uploaded',
            images: selectedImages,
            userId: 'demo-user',
            createdAt: new Date().toISOString(),
            category: 'birthday'
          }}
          userName="Demo User"
          onClose={() => setShowWrap(false)}
          onShare={handleWrapShare}
        />
      )}
    </div>
  );
}