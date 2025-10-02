import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';

export type CarouselApi = {
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  selectedScrollSnap: () => number;
  on: (event: 'select' | 'reInit', cb: () => void) => void;
  off: (event: 'select' | 'reInit', cb: () => void) => void;
};

type CarouselContextValue = {
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  slidesCount: number;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

type CarouselProps = {
  children: React.ReactNode;
  className?: string;
  setApi?: (api: CarouselApi) => void;
  opts?: { loop?: boolean; align?: 'start' | 'center' | 'end' | string };
};

export const Carousel: React.FC<CarouselProps> = ({ children, className, setApi, opts }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listeners = useRef<{ select: Set<() => void>; reInit: Set<() => void> }>({
    select: new Set(),
    reInit: new Set(),
  });
  const slidesCountRef = useRef(0);

  const api = useMemo<CarouselApi>(() => ({
    scrollNext: () => {
      setSelectedIndex(prev => {
        const next = prev + 1;
        const count = Math.max(1, slidesCountRef.current);
        const value = opts?.loop ? next % count : Math.min(next, count - 1);
        queueMicrotask(() => listeners.current.select.forEach(cb => cb()));
        return value;
      });
    },
    scrollTo: (index: number) => {
      setSelectedIndex(() => {
        const count = Math.max(1, slidesCountRef.current);
        const clamped = ((index % count) + count) % count;
        queueMicrotask(() => listeners.current.select.forEach(cb => cb()));
        return clamped;
      });
    },
    selectedScrollSnap: () => selectedIndex,
    on: (event, cb) => {
      listeners.current[event].add(cb);
    },
    off: (event, cb) => {
      listeners.current[event].delete(cb);
    },
  }), [selectedIndex, opts?.loop]);

  useEffect(() => {
    setApi?.(api);
  }, [api, setApi]);

  // Notify reInit when slidesCount changes
  useEffect(() => {
    listeners.current.reInit.forEach(cb => cb());
  }, [selectedIndex]);

  return (
    <CarouselContext.Provider value={{ selectedIndex, setSelectedIndex, slidesCount: slidesCountRef.current }}>
      <div className={className}>{
        React.Children.map(children, child => {
          if (!React.isValidElement(child)) return child;
          // Inject a setter so CarouselContent can set slidesCountRef
          return React.cloneElement(child as any, { __setSlidesCountRef: (n: number) => { slidesCountRef.current = n; } });
        })
      }</div>
    </CarouselContext.Provider>
  );
};

type CarouselContentProps = {
  children: React.ReactNode;
  className?: string;
  __setSlidesCountRef?: (n: number) => void; // internal wiring
};

export const CarouselContent: React.FC<CarouselContentProps> = ({ children, className, __setSlidesCountRef }) => {
  const count = React.Children.count(children);
  useEffect(() => {
    __setSlidesCountRef?.(count);
  }, [count, __setSlidesCountRef]);

  return (
    <div className={`flex gap-4 overflow-x-hidden ${className || ''}`}>
      {children}
    </div>
  );
};

type CarouselItemProps = {
  children: React.ReactNode;
  className?: string;
};

export const CarouselItem: React.FC<CarouselItemProps> = ({ children, className }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default Carousel;


