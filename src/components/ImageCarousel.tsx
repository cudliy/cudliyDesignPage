import { useState, useEffect } from "react";

interface ImageCarouselProps {
  images: string[];
  autoSlideInterval?: number; // in milliseconds
}

const ImageCarousel = ({ images, autoSlideInterval = 5000 }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoSlideInterval);

    return () => clearInterval(interval);
  }, [images.length, autoSlideInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full h-full">
      {/* Image Container */}
      <div className="relative w-full h-full overflow-hidden">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt={`Carousel image ${index + 1}`}
              className="object-contain w-full h-full"
              style={{
                borderRadius: '30px',
                imageRendering: '-webkit-optimize-contrast',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                WebkitFontSmoothing: 'antialiased',
              } as React.CSSProperties}
              loading="eager"
              decoding="async"
            />
          </div>
        ))}
      </div>

      {/* Pagination Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentIndex ? 'bg-white' : 'bg-gray-400'
            }`}
            style={{
              width: '110px',
              height: '8px',
              borderRadius: '20px',
              opacity: 1,
              cursor: 'pointer'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
