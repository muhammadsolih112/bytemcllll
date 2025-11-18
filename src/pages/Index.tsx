
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

import Footer from '@/components/Footer';

import useScrollAnimation from '@/utils/useScrollAnimation';
import ServerStatus from '@/components/ServerStatus';

const Index = () => {
  // Initialize scroll animations
  useScrollAnimation();

  // Set page title
  useEffect(() => {
    document.title = "ByteMC | O'zbek Minecraft Serveri";
  }, []);
  
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <ServerStatus />
      <Footer />
    </div>
  );
};

export default Index;
