import { useEffect, useState } from "react";
import CreatorCard from "./CreatorCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
const FeaturedCreators = () => {
  const creators = [
    { image: "/Lummi Doodle 17.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 3.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 03.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 04 (2).png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 05.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 07.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 18.png", title: "A Colorful Doge" },
    { image: "/Lummi Doodle 19.png", title: "A Colorful Doge" }
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [api, setApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('creators');
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  // Sync selected slide with Embla
  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Autoplay
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(id);
  }, [api]);

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 bg-background" id="creators">
      <div className="max-w-6xl mx-auto">
        <div className={`text-center mb-8 sm:mb-12 md:mb-16 transform transition-all duration-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-abril mb-3 sm:mb-4">
            Featured <span className="text-[#E70A55] animate-pulse">Creators</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-manrope px-4">
            Cudliy turns your words into custom 3D toy designs using AI magic. Preview it. Print it. Play with it.
          </p>
        </div>
        
        <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
          <CarouselContent>
            {creators.map((creator, index) => {
              const distance = Math.min(
                Math.abs(index - selectedIndex),
                creators.length - Math.abs(index - selectedIndex)
              );
              const size = distance === 0 ? "large" : distance === 1 ? "medium" : "small";
              
              // Calculate widths and basis classes for proper carousel spacing
              // Center card: 387px, Side cards: 256px
              let cardWidth, opacity, basisClass;
              
              if (size === "large") {
                // Center card - 387px width, larger basis
                cardWidth = "387px";
                opacity = 1; // Full opacity for center card
                basisClass = "basis-[387px]";
              } else {
                // Side cards - 256px width, smaller basis
                cardWidth = "256px";
                opacity = size === "medium" ? 0.7 : 0.5; // Medium cards: 0.7, Small cards: 0.5
                basisClass = "basis-[256px]";
              }

              return (
                <CarouselItem
                  key={index}
                  className={`${basisClass} flex justify-center`}
                >
                  <div
                    className="transition-all duration-700 ease-in-out will-change-transform"
                    style={{ 
                      width: cardWidth,
                      opacity,
                      transform: 'scale(1)' // No scaling, use exact widths
                    }}
                  >
                    <CreatorCard image={creator.image} title={creator.title} size={size} />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="flex justify-center mt-4 sm:mt-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {creators.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => api?.scrollTo(i)}
                className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full transition-all duration-300 transform hover:scale-150 ${
                  i === selectedIndex ? "bg-[#E70A55] scale-125" : "bg-muted hover:bg-[#E70A55]/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCreators;