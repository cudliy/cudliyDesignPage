import { useState, useRef, useCallback } from 'react';
import { Upload, Check, Share2, Trash2 } from 'lucide-react';
import { toast } from '@/lib/sonner';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  selected: boolean;
  category?: string;
}

interface ImageUploadManagerProps {
  onImagesChange: (images: UploadedImage[]) => void;
  onShare: (selectedImages: UploadedImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageUploadManager({ 
  onImagesChange, 
  onShare, 
  disabled = false,
  maxImages = 5 
}: ImageUploadManagerProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const newFiles = Array.from(files);
    const remainingSlots = maxImages - uploadedImages.length;

    if (newFiles.length > remainingSlots) {
      toast.error(`You can only upload ${remainingSlots} more image(s). Maximum is ${maxImages}.`);
      return;
    }

    const validFiles = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    const newImages: UploadedImage[] = validFiles.map(file => ({
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      url: URL.createObjectURL(file),
      selected: false
    }));

    const updatedImages = [...uploadedImages, ...newImages];
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);

    if (newImages.length > 0) {
      toast.success(`${newImages.length} image(s) uploaded successfully`);
    }
  }, [uploadedImages, disabled, maxImages, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const toggleImageSelection = (imageId: string) => {
    const updatedImages = uploadedImages.map(img => 
      img.id === imageId ? { ...img, selected: !img.selected } : img
    );
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const deleteImage = (imageId: string) => {
    const imageToDelete = uploadedImages.find(img => img.id === imageId);
    if (imageToDelete) {
      URL.revokeObjectURL(imageToDelete.url);
    }
    
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
    toast.success('Image deleted');
  };

  const selectAll = () => {
    const updatedImages = uploadedImages.map(img => ({ ...img, selected: true }));
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const deselectAll = () => {
    const updatedImages = uploadedImages.map(img => ({ ...img, selected: false }));
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const handleShare = () => {
    const selectedImages = uploadedImages.filter(img => img.selected);
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image to share');
      return;
    }
    onShare(selectedImages);
  };

  const selectedCount = uploadedImages.filter(img => img.selected).length;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Upload Area */}
      {uploadedImages.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 mb-4 ${
            dragOver 
              ? 'border-[#E70D57] bg-[#E70D57]/5' 
              : disabled 
                ? 'border-gray-600 bg-gray-800/50 cursor-not-allowed' 
                : 'border-gray-600 hover:border-gray-500 cursor-pointer'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          <Upload className={`w-8 h-8 mx-auto mb-2 ${disabled ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`text-sm ${disabled ? 'text-gray-600' : 'text-gray-300'}`}>
            {disabled 
              ? 'Upload disabled in AI mode' 
              : `Drop images here or click to browse (${uploadedImages.length}/${maxImages})`
            }
          </p>
          {!disabled && (
            <p className="text-xs text-gray-500 mt-1">
              Supports JPG, PNG, GIF up to 10MB each
            </p>
          )}
        </div>
      )}

      {/* Images Grid */}
      {uploadedImages.length > 0 && (
        <div className="flex-1 flex flex-col">
          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors"
              >
                Deselect All
              </button>
              {selectedCount > 0 && (
                <span className="text-xs text-gray-400">
                  {selectedCount} selected
                </span>
              )}
            </div>
            
            {selectedCount > 0 && (
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-[#E70D57] hover:bg-[#d10c50] text-white rounded-full text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share ({selectedCount})
              </button>
            )}
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
            {uploadedImages.map((image) => (
              <div
                key={image.id}
                className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  image.selected 
                    ? 'border-[#E70D57] ring-2 ring-[#E70D57]/30' 
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => toggleImageSelection(image.id)}
              >
                <img
                  src={image.url}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
                
                {/* Selection Overlay */}
                <div className={`absolute inset-0 bg-black/20 transition-opacity ${
                  image.selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      image.selected 
                        ? 'bg-[#E70D57] border-[#E70D57]' 
                        : 'bg-black/50 border-white/70'
                    }`}>
                      {image.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(image.id);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedImages.length === 0 && disabled && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No images uploaded</p>
            <p className="text-xs mt-1">Cancel AI session to enable upload</p>
          </div>
        </div>
      )}
    </div>
  );
}