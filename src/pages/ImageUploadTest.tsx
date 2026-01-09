import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ImageUploadTest() {
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => ({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        selected: true
      }));
      
      setUploadedImages(newImages);
    }
  };

  const handleShare = () => {
    if (uploadedImages.length === 0) {
      alert('Please upload some images first');
      return;
    }

    // Store images for sharing
    const imageData = {
      type: 'uploaded',
      images: uploadedImages.map(img => ({
        id: img.id,
        url: img.url,
        selected: true
      })),
      userId: 'test-user',
      createdAt: new Date().toISOString()
    };
    
    sessionStorage.setItem('share_images', JSON.stringify(imageData));
    navigate('/share/images');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Image Upload Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {uploadedImages.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-4">Uploaded Images ({uploadedImages.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                {uploadedImages.map((image, index) => (
                  <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={image.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleShare}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Share These Images
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium mb-4">Debug Info</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(uploadedImages, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}