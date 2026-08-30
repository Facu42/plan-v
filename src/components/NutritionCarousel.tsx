import { useState, useRef, useEffect } from 'react';
import { CaloriesView } from './CaloriesView';
import { MacronutrientsView } from './MacronutrientsView';

interface NutritionCarouselProps {
  calorieData: {
    dailyGoal: number;
    consumed: number;
    burned: number;
  };
  macroData: {
    protein: { current: number; goal: number; };
    carbs: { current: number; goal: number; };
    fats: { current: number; goal: number; };
    fiber: { current: number; goal: number; };
  };
}

export function NutritionCarousel({ calorieData, macroData }: NutritionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current!.offsetLeft);
    setScrollLeft(containerRef.current!.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    snapToNearest();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - containerRef.current!.offsetLeft);
    setScrollLeft(containerRef.current!.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - containerRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    snapToNearest();
  };

  const snapToNearest = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const scrollPosition = containerRef.current.scrollLeft;
    const newIndex = Math.round(scrollPosition / containerWidth);
    setCurrentIndex(newIndex);
    containerRef.current.scrollTo({
      left: newIndex * containerWidth,
      behavior: 'smooth'
    });
  };

  const scrollToIndex = (index: number) => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    containerRef.current.scrollTo({
      left: index * containerWidth,
      behavior: 'smooth'
    });
    setCurrentIndex(index);
  };

  return (
    <div className="px-4">
      {/* Indicators */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-2">
          {[0, 1].map((index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentIndex === index ? 'bg-[#2d6a4f]' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-8">
          <button
            onClick={() => scrollToIndex(0)}
            className={`text-sm transition-colors ${
              currentIndex === 0 ? 'text-[#2d6a4f]' : 'text-gray-500'
            }`}
          >
            Calorías
          </button>
          <button
            onClick={() => scrollToIndex(1)}
            className={`text-sm transition-colors ${
              currentIndex === 1 ? 'text-[#2d6a4f]' : 'text-gray-500'
            }`}
          >
            Macronutrientes
          </button>
        </div>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-shrink-0 w-full">
          <CaloriesView
            dailyGoal={calorieData.dailyGoal}
            consumed={calorieData.consumed}
            burned={calorieData.burned}
          />
        </div>
        <div className="flex-shrink-0 w-full">
          <MacronutrientsView
            protein={macroData.protein}
            carbs={macroData.carbs}
            fats={macroData.fats}
            fiber={macroData.fiber}
          />
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}