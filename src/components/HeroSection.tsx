import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LiquidButton } from "./ui/liquid-glass-button.tsx";

interface HeroData {
  title: string;
  subtitle: string;
  backgroundImage: string;
  buttonText: string;
  buttonLink: string;
}

const HeroSection: React.FC = () => {
  const [heroData, setHeroData] = useState<HeroData>({
    title: 'Welcome to TURFION',
    subtitle: 'Discover and book amazing sports venues and activities',
    backgroundImage: 'https://images.pexels.com/photos/3657154/pexels-photo-3657154.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1',
    buttonText: 'Explore Now',
    buttonLink: '#cards'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const heroDoc = await getDoc(doc(db, 'settings', 'hero'));
        if (heroDoc.exists()) {
          const data = heroDoc.data() as HeroData;
          // Optimize image URL if it's from Pexels
          if (data.backgroundImage && data.backgroundImage.includes('pexels.com')) {
            data.backgroundImage = data.backgroundImage.replace(/w=\d+&h=\d+&dpr=\d+/, 'w=800&h=600&dpr=1');
          }
          setHeroData(data);
        }
      } catch (error) {
        console.error('Error fetching hero data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch to improve perceived performance
    const timeoutId = setTimeout(fetchHeroData, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  const handleButtonClick = () => {
    if (heroData.buttonLink.startsWith('#')) {
      const element = document.querySelector(heroData.buttonLink);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.open(heroData.buttonLink, '_blank');
    }
  };

  // Call motion hooks on every render to keep hooks order stable
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 30]);

  if (loading) {
    return (
      <div className="relative h-64 sm:h-80 md:h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl mb-12">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 dark:text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[70vh] min-h-80 rounded-[1.25rem] overflow-hidden mb-12 mt-4 shadow-[0_20px_60px_rgba(13,71,161,0.25)]">
      {/* Motion Background */}
      <motion.div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroData.backgroundImage})`, y }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/30 to-background/10" />
        <div className="absolute -inset-40 bg-[radial-gradient(ellipse_at_top,_rgba(0,229,255,0.25),_transparent_60%)]" />
        <div className="absolute -inset-40 bg-[radial-gradient(ellipse_at_bottom,_rgba(13,71,161,0.25),_transparent_60%)]" />
      </motion.div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center px-4">
        <motion.div 
          className="max-w-4xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,hsl(217_89%_45%),hsl(211_86%_55%),hsl(192_100%_50%))]" style={{ fontFamily: 'Amaranth, sans-serif' }}>
            {heroData.title}
          </h1>
          <p className="text-base sm:text-xl md:text-2xl mb-8 text-foreground/80 leading-relaxed px-2" style={{ fontFamily: 'Lato, sans-serif' }}>
            {heroData.subtitle}
          </p>
          <LiquidButton onClick={handleButtonClick} className="rounded-full">
            {heroData.buttonText}
          </LiquidButton>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;