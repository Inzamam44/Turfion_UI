import { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
const HeroSection = lazy(() => import('./components/HeroSection'));
const Footer = lazy(() => import('./components/Footer'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Games = lazy(() => import('./components/Games'));
const CardDetails = lazy(() => import('./components/CardDetails'));
const BookingCalendar = lazy(() => import('./components/BookingCalendar'));
const BookingReceipt = lazy(() => import('./components/BookingReceipt'));
import LoadingSpinner from './components/LoadingSpinner';
// Additional lazy-loaded components
const Login = lazy(() => import('./components/Login'));
const SignUp = lazy(() => import('./components/SignUp'));
const SportsGroundDetails = lazy(() => import('./components/SportsGroundDetails'));
const Profile = lazy(() => import('./components/Profile'));
const MfaSettings = lazy(() => import('./components/MfaSettings'));
const CommunityCards = lazy(() => import('./components/CommunityCards'));
import { useAuth } from './contexts/AuthContext';
import { LogOut, User, ChevronDown, BarChart3, LogIn, Menu, X, Shield, AlertTriangle } from 'lucide-react';
import { SportsGround } from './types';
import { isFirebaseInitialized } from './lib/firebase';
// Lazy-load heavy visual component to defer its bundle until after initial render
const EtheralShadow = lazy(() => import('./components/ui/etheral-shadow').then(mod => ({ default: mod.Component })));
import { ThemeToggle } from './components/ui/theme-toggle';
import BrandLogo from './images/logo.png';

const sportsGrounds: SportsGround[] = [
  {
    id: '1',
    name: 'Victory Sports Arena',
    rating: 4.5,
    sports: ['Football'],
    location: 'Banjara Hills',
    area: 'Hyderabad',
    image: "https://img.olympics.com/images/image/private/t_s_pog_staticContent_hero_sm_2x/f_auto/primary/hsz5zl0ur6fuza7gfpx8",
    pricePerHour: 1200,
    distance: '3.2 km',
    openingTime: 'Opens tomorrow at 6:00am'
  },
  {
    id: '2',
    name: 'Champions Cricket Ground',
    rating: 4.3,
    sports: ['Cricket'],
    location: 'Jubilee Hills',
    area: 'Hyderabad',
    image: "https://images.pexels.com/photos/3657154/pexels-photo-3657154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    pricePerHour: 1500,
    distance: '5.1 km',
    openingTime: 'Opens tomorrow at 5:30am'
  },
  {
    id: '3',
    name: 'Elite Tennis Club',
    rating: 4.8,
    sports: ['Badminton'],
    location: 'Gachibowli',
    area: 'Hyderabad',
    image: "https://img.olympics.com/images/image/private/t_s_pog_staticContent_hero_sm_2x/f_auto/primary/hsz5zl0ur6fuza7gfpx8",
    pricePerHour: 800,
    distance: '7.4 km',
    openingTime: 'Opens tomorrow at 7:00am'
  }
];

// Protected routes that require authentication
const protectedRoutes = ['/games', '/profile', '/dashboard', '/book', '/receipt', '/mfa-settings'];

function App() {
  const { user, logout, userProfile, firebaseError } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Navbar show/hide on scroll
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY <= 0) {
            setNavbarVisible(true);
          } else if (currentScrollY > lastScrollY) {
            setNavbarVisible(false); // scrolling down
          } else {
            setNavbarVisible(true); // scrolling up
          }
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Check if current route requires authentication
  const requiresAuth = protectedRoutes.some(route => 
    location.pathname.startsWith(route)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle authentication for protected routes
  useEffect(() => {
    if (requiresAuth && !user && !showLogin && !showSignUp) {
      setShowLogin(true);
    }
  }, [requiresAuth, user, showLogin, showSignUp]);

  // Show Firebase configuration error if present
  if (firebaseError) {
    return (
      <div className="min-h-screen bg-red-50/60 dark:bg-red-900/20 flex items-center justify-center p-4">
        <EtheralShadow
          color="rgba(128,128,128,0.35)"
          animation={{ scale: 60, speed: 60 }}
          noise={{ opacity: 0.3, scale: 1.2 }}
          sizing="fill"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative z-10">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400 mr-3" />
            <h1 className="text-xl font-bold text-red-800 dark:text-red-400">Configuration Error</h1>
          </div>
          <p className="text-red-700 dark:text-red-300 mb-4">{firebaseError}</p>
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 dark:text-red-400 mb-2">For Netlify Deployment:</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              Go to your Netlify dashboard → Site settings → Environment variables and add:
            </p>
            <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 font-mono">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
              <li>VITE_FIREBASE_STORAGE_BUCKET</li>
              <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
              <li>VITE_FIREBASE_APP_ID</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen if Firebase is not initialized
  if (!isFirebaseInitialized) {
    return (
      <div className="min-h-screen bg-gray-50/60 dark:bg-gray-900/80 flex items-center justify-center">
        <EtheralShadow
          color="rgba(128,128,128,0.35)"
          animation={{ scale: 60, speed: 60 }}
          noise={{ opacity: 0.3, scale: 1.2 }}
          sizing="fill"
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
        />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing application...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogin(false);
      setShowSignUp(false);
      setShowMobileMenu(false);
      setShowUserDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out');
    }
  };

  const handleProfileClick = () => {
    setShowMobileMenu(false);
    setShowUserDropdown(false);
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    setShowMobileMenu(false);
    setShowUserDropdown(false);
    navigate('/dashboard');
  };

  const handleGamesClick = () => {
    setShowMobileMenu(false);
    navigate('/games');
  };

  const handleLoginSuccess = () => {
    setShowLogin(false);
    setShowSignUp(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const getRoleTag = (role: string) => {
    const roleColors: Record<string, string> = {
      user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      host: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      admin: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const UserDropdownCard = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 z-50">
      <div className="flex items-start space-x-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center ${userProfile?.photoURL ? 'hidden' : ''}`}>
            <User className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {userProfile?.displayName || 'User'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-2">{user?.email}</p>
          
          {/* Role Badge */}
          <div className="flex items-center space-x-2 mb-3">
            {userProfile?.role && getRoleTag(userProfile.role)}
            {userProfile?.mfaEnabled && (
              <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400">
                <Shield className="w-3 h-3" />
                <span>MFA</span>
              </div>
            )}
          </div>
          
          {/* Additional Info */}
          {userProfile?.phoneNumber && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              📞 {userProfile.phoneNumber}
            </p>
          )}
          
          {/* Quick Actions */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleProfileClick}
              className="w-full bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              View Profile
            </button>
            <button
              onClick={handleDashboardClick}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs py-2 px-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const MobileMenu = () => (
    <div className="lg:hidden">
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
        <div 
          ref={mobileMenuRef}
          className="fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Menu</span>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          
          <div className="py-4">
            <button
              onClick={handleGamesClick}
              className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Join Games
            </button>
            
            {user ? (
              <>
                <button
                  onClick={handleDashboardClick}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={handleProfileClick}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowLogin(true);
                  setShowSignUp(false);
                }}
                className="w-full text-left px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                data-login-trigger
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Show login prompt for protected routes when not authenticated
  const LoginPrompt = () => (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm sm:text-base">
          You need to be signed in to access this page. Please log in to continue.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setShowLogin(true)}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <EtheralShadow
        color="rgba(128,128,128,0.35)"
        animation={{ scale: 60, speed: 60 }}
        noise={{ opacity: 0.3, scale: 1.2 }}
        sizing="fill"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      {/* Subtle background watermark */}
      <div aria-hidden className="fixed inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
        <div
          className="w-[60vmin] h-[60vmin] opacity-5 bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: `url(${BrandLogo})` }}
        />
      </div>
      <div className="min-h-screen bg-background transition-colors duration-200 relative z-10 pt-20">
        <nav
          className={`z-40 p-5 fixed left-0 w-full transition-all duration-500 ease-in-out
            ${navbarVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-full pointer-events-none'}
          `}
          style={{ top: 0 }}
        >
          <div className="container mx-auto max-w-5xl">
            <div className="backdrop-blur-xl bg-card/80 border border-border rounded-full shadow-[0_2px_24px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-3">
              <div className="flex justify-between items-center">
                <a 
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                    setShowLogin(false);
                    setShowSignUp(false);
                  }} 
                  className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-full group"
                >
                  <img
                    src={BrandLogo}
                    alt="Turfion"
                    className="h-6 sm:h-7 object-contain"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'inline-block';
                    }}
                  />
                  <span className="font-extrabold tracking-tight text-xl sm:text-2xl bg-gradient-to-r from-[hsl(217_89%_45%)] via-[hsl(211_86%_50%)] to-[hsl(192_100%_50%)] bg-clip-text text-transparent group-hover:brightness-110 transition" style={{ fontFamily: 'Amaranth, sans-serif' }}>
                    TURFION
                  </span>
                </a>
                
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-2">
                  <button
                    onClick={() => navigate('/games')}
                    className="px-4 py-2 rounded-full text-foreground hover:text-primary-foreground bg-transparent hover:bg-primary/90 transition-all duration-200 shadow-none hover:shadow-[0_8px_30px_rgba(13,71,161,0.25)]"
                  >
                    Join Games
                  </button>
                  <ThemeToggle />
                  {user ? (
                    <div className="relative" ref={userDropdownRef}>
                      <button 
                        onClick={toggleUserDropdown}
                        className="flex items-center space-x-2 text-foreground px-4 py-2 rounded-full hover:bg-secondary/20 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                          {userProfile?.photoURL ? (
                            <img
                              src={userProfile.photoURL}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full bg-gradient-to-r from-[hsl(217_89%_45%)] to-[hsl(211_86%_55%)] flex items-center justify-center ${userProfile?.photoURL ? 'hidden' : ''}`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Dropdown Card */}
                      {showUserDropdown && <UserDropdownCard />}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowLogin(true);
                        setShowSignUp(false);
                      }}
                      className="px-4 py-2 rounded-full text-primary-foreground bg-primary hover:brightness-110 transition-all duration-200 shadow-[0_8px_30px_rgba(0,229,255,0.25)]"
                      data-login-trigger
                    >
                      Login
                    </button>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <div className="lg:hidden flex items-center space-x-2">
                  <ThemeToggle />
                  <button
                    onClick={() => setShowMobileMenu(true)}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {showMobileMenu && <MobileMenu />}

        <div className="pt-0">
          {showLogin && !user ? (
            <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
              <Login 
                onSignUpClick={() => {
                  setShowLogin(false);
                  setShowSignUp(true);
                }}
                onSuccess={handleLoginSuccess}
              />
            </Suspense>
          ) : showSignUp && !user ? (
            <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
              <SignUp 
                onLoginClick={() => {
                  setShowSignUp(false);
                  setShowLogin(true);
                }}
                onSuccess={handleLoginSuccess}
              />
            </Suspense>
          ) : requiresAuth && !user ? (
            <LoginPrompt />
          ) : (
            // Lightweight transition wrapper (avoids loading framer-motion on startup).
            <div key={location.pathname} className="transition-all duration-200">
              <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
                <Routes location={location}>
                  <Route path="/ground/:id" element={<SportsGroundDetails grounds={sportsGrounds} />} />
                  <Route path="/card/:id" element={<CardDetails />} />
                  <Route path="/book/:id" element={<BookingCalendar />} />
                  <Route path="/receipt/:id" element={<BookingReceipt isModal={false} />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/mfa-settings" element={<MfaSettings />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/" element={
                    <div className="container mx-auto px-4 py-8">
                      {/* Hero Section */}
                      <HeroSection />
                      
                      {/* Community Cards Section */}
                      <div id="cards">
                        <Suspense fallback={<LoadingSpinner size="md" className="py-12" />}>
                          <CommunityCards />
                        </Suspense>
                      </div>
                    </div>
                  } />
                </Routes>
              </Suspense>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}

export default App;