import { useRef } from 'react';
import { toast } from '@/lib/sonner';

interface MobileImageUploadButtonProps {
  onImagesSelected: (files: FileList) => void;
  className?: string;
}

export default function MobileImageUploadButton({ onImagesSelected, className = '' }: MobileImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error(`${file.name} is too large. Maximum size is 100MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      const fileList = new DataTransfer();
      validFiles.forEach(file => fileList.items.add(file));
      onImagesSelected(fileList.files);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`flex items-center justify-center transition-colors ${className}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files);
          }
        }}
        className="hidden"
      />
    </>
  );
}