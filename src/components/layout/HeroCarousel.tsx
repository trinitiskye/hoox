'use client';

import { useState, useEffect } from 'react';
import { Trophy, Fish, Camera } from 'lucide-react';

const carouselSlides = [
  {
    icon: Trophy,
    title: 'Welcome to FishTournament Pro',
    subtitle: 'The Ultimate Platform for Fishing Tournaments',
    gradient: 'from-blue-600 to-cyan-500'
  },
  {
    icon: Camera,
    title: 'Track Your Success',
    subtitle: 'Real-time Results & Leaderboards',
    gradient: 'from-purple-600 to-pink-500'
  },
  {
    icon: Fish,
    title: 'Join the Community',
    subtitle: 'Connect with Anglers Nationwide',
    gradient: 'from-green-600 to-emerald-500'
  }
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = carouselSlides[currentIndex].icon;

  return (
    <div className="relative w-full overflow-hidden h-64 sm:h-80 md:h-96 lg:h-[400px]">
      {/* Carousel Slides */}
      <div 
        className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {carouselSlides.map((slide, index) => {
          const Icon = slide.icon;
          return (
            <div
              key={index}
              className={`w-full flex-shrink-0 bg-gradient-to-br ${slide.gradient}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white px-4 sm:px-8 max-w-4xl">
                  <Icon className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 md:mb-6 opacity-90" />
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
                    {slide.title}
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 z-10">
        {carouselSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 sm:h-3 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-white w-6 sm:w-8' 
                : 'bg-white/50 hover:bg-white/75 w-2 sm:w-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
