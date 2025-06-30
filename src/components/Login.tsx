import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ToggleLeft as Google, Shield, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

type LoginProps = {
  onSignUpClick: () => void;
  onSuccess?: () => void;
};

interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  error?: string;
}

const AnimatedFormField: React.FC<FormFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  onToggle,
  showPassword,
  error
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative group">
      <div
        className={`relative overflow-hidden rounded-lg border transition-all duration-300 ease-in-out ${
          error 
            ? 'border-red-500 dark:border-red-400' 
            : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-800`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
          error 
            ? 'text-red-500 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400'
        }`}>
          {icon}
        </div>
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent pl-10 pr-12 py-3 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
          placeholder=""
        />
        
        <label className={`absolute left-10 transition-all duration-200 ease-in-out pointer-events-none ${
          isFocused || value 
            ? 'top-2 text-xs font-medium' 
            : 'top-1/2 -translate-y-1/2 text-sm'
        } ${
          error 
            ? 'text-red-500 dark:text-red-400' 
            : 'text-gray-500 dark:text-gray-400'
        } ${isFocused || value ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          {placeholder}
        </label>

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`
            }}
          />
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

const FloatingParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        if (!canvas) {
          // Initialize with default values if canvas is null
          this.x = 0;
          this.y = 0;
          this.size = 1;
          this.speedX = 0;
          this.speedY = 0;
          this.opacity = 0;
          return;
        }
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.3;
      }

      update() {
        if (!canvas) return;
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(59, 130, 246, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle();
      if (particle.x !== 0 || particle.y !== 0) { // Check if particle was created with valid values
        particles.push(particle);
      }
    }

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};

const Login = ({ onSignUpClick, onSuccess }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [showMfaInput, setShowMfaInput] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMfaSecret, setUserMfaSecret] = useState('');
  const [tempUser, setTempUser] = useState<{ email: string; password: string; uid: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithGoogle } = useAuth();

  // Improved TOTP verification
  const verifyMfaCode = (secret: string, token: string): boolean => {
    if (!secret || !token || token.length !== 6) return false;
    
    const window = Math.floor(Date.now() / 30000);
    
    // Check current window and ±2 windows for clock drift tolerance
    for (let i = -2; i <= 2; i++) {
      const timeWindow = window + i;
      const expectedToken = generateTOTP(secret, timeWindow);
      if (expectedToken === token) {
        return true;
      }
    }
    return false;
  };

  const generateTOTP = (secret: string, timeWindow: number): string => {
    try {
      const key = base32ToBytes(secret);
      
      // Convert time to 8-byte array (big-endian)
      const timeBytes = new ArrayBuffer(8);
      const timeView = new DataView(timeBytes);
      timeView.setUint32(4, timeWindow, false); // big-endian
      
      // Generate HMAC-SHA1
      const hash = hmacSha1(key, new Uint8Array(timeBytes));
      
      // Dynamic truncation
      const offset = hash[hash.length - 1] & 0xf;
      const code = ((hash[offset] & 0x7f) << 24) |
                   ((hash[offset + 1] & 0xff) << 16) |
                   ((hash[offset + 2] & 0xff) << 8) |
                   (hash[offset + 3] & 0xff);
      
      return (code % 1000000).toString().padStart(6, '0');
    } catch (error) {
      console.error('Error generating TOTP:', error);
      return '000000';
    }
  };

  const base32ToBytes = (base32: string): Uint8Array => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output = [];
    
    const cleanBase32 = base32.replace(/=/g, '').toUpperCase();
    
    for (let i = 0; i < cleanBase32.length; i++) {
      const char = cleanBase32[i];
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      
      value = (value << 5) | index;
      bits += 5;
      
      if (bits >= 8) {
        output.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }
    
    return new Uint8Array(output);
  };

  const hmacSha1 = (key: Uint8Array, data: Uint8Array): Uint8Array => {
    const blockSize = 64;
    
    // Pad or hash key if necessary
    const paddedKey = new Uint8Array(blockSize);
    if (key.length > blockSize) {
      // Hash the key if it's too long (simplified)
      const hashedKey = simpleHash(key);
      paddedKey.set(hashedKey.slice(0, blockSize));
    } else {
      paddedKey.set(key);
    }
    
    // Create inner and outer padding
    const innerPad = new Uint8Array(blockSize);
    const outerPad = new Uint8Array(blockSize);
    
    for (let i = 0; i < blockSize; i++) {
      innerPad[i] = paddedKey[i] ^ 0x36;
      outerPad[i] = paddedKey[i] ^ 0x5c;
    }
    
    // Hash inner pad + data
    const innerHash = simpleHash(new Uint8Array([...innerPad, ...data]));
    
    // Hash outer pad + inner hash
    const finalHash = simpleHash(new Uint8Array([...outerPad, ...innerHash]));
    
    return finalHash;
  };

  const simpleHash = (data: Uint8Array): Uint8Array => {
    // Simplified SHA-1 like hash (for demo purposes)
    const result = new Uint8Array(20);
    let h0 = 0x67452301;
    let h1 = 0xEFCDAB89;
    let h2 = 0x98BADCFE;
    let h3 = 0x10325476;
    let h4 = 0xC3D2E1F0;
    
    // Process data in chunks
    for (let i = 0; i < data.length; i += 64) {
      const chunk = data.slice(i, i + 64);
      
      // Simple mixing function
      for (let j = 0; j < chunk.length; j++) {
        h0 = ((h0 << 5) | (h0 >>> 27)) + chunk[j] + h1;
        h1 = h2;
        h2 = (h3 << 30) | (h3 >>> 2);
        h3 = h4;
        h4 = h0;
      }
    }
    
    // Convert to bytes
    const view = new DataView(result.buffer);
    view.setUint32(0, h0, false);
    view.setUint32(4, h1, false);
    view.setUint32(8, h2, false);
    view.setUint32(12, h3, false);
    view.setUint32(16, h4, false);
    
    return result;
  };

  const isDeviceRemembered = (email: string): boolean => {
    try {
      const rememberedDevices = JSON.parse(localStorage.getItem('mfaRememberedDevices') || '{}');
      const deviceKey = `${email}_${navigator.userAgent.slice(0, 50)}`;
      const deviceData = rememberedDevices[deviceKey];
      
      if (deviceData && new Date(deviceData.expires) > new Date()) {
        return true;
      }
      
      if (deviceData && new Date(deviceData.expires) <= new Date()) {
        delete rememberedDevices[deviceKey];
        localStorage.setItem('mfaRememberedDevices', JSON.stringify(rememberedDevices));
      }
      
      return false;
    } catch (error) {
      console.error('Error checking remembered device:', error);
      return false;
    }
  };

  const rememberDeviceForMfa = (email: string) => {
    try {
      const rememberedDevices = JSON.parse(localStorage.getItem('mfaRememberedDevices') || '{}');
      const deviceKey = `${email}_${navigator.userAgent.slice(0, 50)}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      rememberedDevices[deviceKey] = {
        expires: expiryDate.toISOString(),
        created: new Date().toISOString()
      };
      
      localStorage.setItem('mfaRememberedDevices', JSON.stringify(rememberedDevices));
    } catch (error) {
      console.error('Error remembering device:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!auth) {
        setError('Authentication service is not available.');
        setIsLoading(false);
        return;
      }

      // First, try to sign in to validate credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check for MFA settings
      if (!db) {
        setError('Database service is not available.');
        setIsLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        if (userData.mfaEnabled && userData.mfaSecret) {
          // Check if device is remembered
          if (isDeviceRemembered(email)) {
            // Device is remembered, complete login
            if (onSuccess) onSuccess();
            return;
          }
          
          // MFA is required - sign out temporarily and show MFA input
          await auth.signOut();
          setUserMfaSecret(userData.mfaSecret);
          setTempUser({ email, password, uid: user.uid });
          setShowMfaInput(true);
          setIsLoading(false);
          return;
        }
      }
      
      // No MFA required, complete login
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error('Login error:', err);
      const error = err as { code?: string };
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!mfaCode || mfaCode.length !== 6) {
        setError('Please enter a valid 6-digit MFA code');
        setIsLoading(false);
        return;
      }

      if (!userMfaSecret) {
        setError('MFA secret not found. Please try logging in again.');
        setIsLoading(false);
        return;
      }

      // Verify MFA code
      const isValidCode = verifyMfaCode(userMfaSecret, mfaCode);
      
      if (!isValidCode) {
        setError('Invalid MFA code. Please check your authenticator app and try again.');
        setIsLoading(false);
        return;
      }

      // MFA verified, now complete the sign in
      if (tempUser && auth) {
        await signInWithEmailAndPassword(auth, tempUser.email, tempUser.password);
        
        // Remember device if requested
        if (rememberDevice) {
          rememberDeviceForMfa(tempUser.email);
        }
        
        // Clear temporary data
        setTempUser(null);
        setShowMfaInput(false);
        setMfaCode('');
        setUserMfaSecret('');
        
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      console.error('MFA verification error:', err);
      const error = err as { code?: string };
      if (error.code === 'auth/invalid-credential') {
        setError('Session expired. Please try logging in again.');
        setShowMfaInput(false);
        setTempUser(null);
        setMfaCode('');
        setUserMfaSecret('');
      } else {
        setError('Failed to verify MFA code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { code?: string };
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          setError('Sign-in was cancelled. Please try again.');
          break;
        case 'auth/popup-blocked':
          setError('Popup was blocked. Please allow popups and try again.');
          break;
        case 'auth/account-exists-with-different-credential':
          setError('An account already exists with this email using a different sign-in method.');
          break;
        default:
          setError('Failed to sign in with Google. Please try again.');
      }
    }
  };

  if (showMfaInput) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingParticles />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Two-Factor Authentication
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6" role="alert">
                <span className="block text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleMfaSubmit} className="space-y-6">
              <div>
                <input
                  id="mfaCode"
                  name="mfaCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  className="w-full bg-transparent px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg font-mono"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                />
              </div>

              <div className="flex items-center">
                <input
                  id="rememberDevice"
                  name="rememberDevice"
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                />
                <label htmlFor="rememberDevice" className="ml-2 block text-sm text-gray-900 dark:text-white">
                  Don't ask on this browser for 30 days
                </label>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading || mfaCode.length !== 6}
                  className="w-full relative group bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <span className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </span>
                  
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowMfaInput(false);
                    setMfaCode('');
                    setError('');
                    setTempUser(null);
                    setUserMfaSecret('');
                  }}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-300 dark:border-gray-600 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6" role="alert">
              <span className="block text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 mb-6"
          >
            <Google size={20} />
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatedFormField
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
            />

            <AnimatedFormField
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className={`transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </span>
              
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New to Akxtral? {' '}
              <button 
                onClick={onSignUpClick}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;