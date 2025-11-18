
import { ArrowRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-gradient-hero hero-glow">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-crypto-purple/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-crypto-light-purple/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 animate-fade-in-left">
            <div className="inline-flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <span className="text-xs font-medium text-crypto-purple mr-2">ByteMC</span>
              <span className="text-xs text-gray-300">O'zbek Minecraft serveri</span>
              <ChevronRight className="h-4 w-4 text-gray-400 ml-1" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="text-gradient">Minecraft</span> serveri — ByteMC
            </h1>
            <p className="text-lg text-gray-300 mb-8 max-w-lg">
              O'ynang, muloqot qiling va jamiyatga qo'shiling. IP: <b>bytemc.uz</b>. Ban/mute sabablarini ommaviy ko'ring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/bans">
                <Button size="lg" className="bg-crypto-purple hover:bg-crypto-dark-purple text-white px-8 py-6">
                  Banlar
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mutes">
                <Button variant="outline" size="lg" className="border-gray-700 text-white hover:bg-white/5 py-6">
                  Mutelar
                  <ArrowUpRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center space-x-6">
              <div>
                <p className="text-2xl font-bold text-white">bytemc.uz</p>
                <p className="text-sm text-gray-400">Server IP</p>
              </div>
              <div className="h-12 w-px bg-gray-700"></div>
              <div>
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="text-sm text-gray-400">Uptime</p>
              </div>
              <div className="h-12 w-px bg-gray-700"></div>
              <div>
                <p className="text-2xl font-bold text-white">O'zbek</p>
                <p className="text-sm text-gray-400">Jamiyat</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 mt-12 lg:mt-0 animate-fade-in-right">
            <div className="relative max-w-md mx-auto animate-float">
              <img 
                src="https://images.unsplash.com/photo-1617957770455-8cbb0b2a8b5b?auto=format&fit=crop&h=800"
                alt="Minecraft gameplay" 
                className="rounded-xl shadow-2xl border border-white/10"
              />
              <div className="absolute -right-6 -bottom-6 bg-crypto-purple/20 backdrop-blur-md rounded-lg p-4 border border-crypto-purple/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Online</p>
                    <p className="text-lg font-bold text-green-500">Live</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-6 -top-6 bg-crypto-purple/20 backdrop-blur-md rounded-lg p-4 border border-crypto-purple/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-crypto-purple/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-crypto-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">IP</p>
                    <p className="text-lg font-bold text-white">bytemc.uz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
