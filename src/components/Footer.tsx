import React from 'react';
import { Mail } from 'lucide-react';
import BrandLogo from '../images/logo.png';

const Footer: React.FC = () => {
  return (
    <footer className="mt-20">
      <div className="container mx-auto px-4">
        <div className="rounded-[1.25rem] border border-border bg-card/70 backdrop-blur-xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={BrandLogo} alt="Turfion" className="h-8 w-8 object-contain" />
                <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-[linear-gradient(90deg,hsl(217_89%_45%),hsl(211_86%_55%),hsl(192_100%_50%))]" style={{ fontFamily: 'Amaranth, sans-serif' }}>TURFION</span>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed text-sm sm:text-base">
                Premium sports-tech platform to discover, book, and play at top venues.
              </p>
              <div className="flex items-center space-x-2 text-muted-foreground mb-4">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a 
                  href="mailto:info@turfion.com" 
                  className="hover:text-primary transition-colors duration-200 text-sm sm:text-base"
                >
                  info@turfion.com
                </a>
              </div>
              <p className="text-muted-foreground/70 text-xs sm:text-sm">
                A product of Akxtral
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base sm:text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm sm:text-base">
                    Home
                  </a>
                </li>
                <li>
                  <a href="/games" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm sm:text-base">
                    Join Games
                  </a>
                </li>
                <li>
                  <a href="/profile" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm sm:text-base">
                    Profile
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm sm:text-base">
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-muted-foreground text-xs sm:text-sm text-center md:text-left">
              © {new Date().getFullYear()} TURFION. All rights reserved.
            </div>
            <div className="text-muted-foreground text-xs sm:text-sm text-center">
              Made with ❤️ for sports enthusiasts
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;