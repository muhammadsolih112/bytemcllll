import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-crypto-blue/80 backdrop-blur-md py-3 shadow-lg' : 'py-6'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/bytemc" className="text-2xl font-bold text-white">
            Byte<span className="text-crypto-purple">MC</span>
          </Link>
        </div>

        {/* Desktop menu */}
        <ul className="hidden lg:flex items-center space-x-8">
          <li>
            <Link to="/bytemc" className="text-gray-300 hover:text-white transition-colors">Bosh sahifa</Link>
          </li>
          <li>
            <Link to="/bans" className="text-gray-300 hover:text-white transition-colors">Banlar</Link>
          </li>
          <li>
            <Link to="/mutes" className="text-gray-300 hover:text-white transition-colors">Mutelar</Link>
          </li>
          <li>
            <Link to="/kicks" className="text-gray-300 hover:text-white transition-colors">Kicklar</Link>
          </li>
          <li>
            <Link to="/rules" className="text-gray-300 hover:text-white transition-colors">Qoidalar</Link>
          </li>
        </ul>

        <div className="hidden lg:flex items-center space-x-4">
          <Link to="/admin">
            <Button className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full">Admin</Button>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="lg:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-crypto-blue/95 backdrop-blur-lg absolute top-full left-0 w-full py-4 shadow-lg">
          <div className="container mx-auto px-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link to="/bytemc" className="text-gray-300 hover:text-white transition-colors block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Bosh sahifa
                </Link>
              </li>
              <li>
                <Link to="/bans" className="text-gray-300 hover:text-white transition-colors block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Banlar
                </Link>
              </li>
              <li>
                <Link to="/mutes" className="text-gray-300 hover:text-white transition-colors block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Mutelar
                </Link>
              </li>
              <li>
                <Link to="/kicks" className="text-gray-300 hover:text-white transition-colors block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Kicklar
                </Link>
              </li>
              <li>
                <Link to="/rules" className="text-gray-300 hover:text-white transition-colors block py-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Qoidalar
                </Link>
              </li>
              <li className="pt-4 flex flex-col space-y-3">
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="bg-crypto-purple hover:bg-crypto-dark-purple text-white w-full">Admin</Button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
