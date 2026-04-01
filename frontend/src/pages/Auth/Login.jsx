import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { login, forgotPassword, finalizeLogin } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiLock, FiMail } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin as googleLoginService } from '../../services/authService';
import { motion, AnimatePresence } from 'framer-motion';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [loginUserId, setLoginUserId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login: setAuth } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail('');
      setPassword('');
    }, 150); 
    return () => clearTimeout(timer);
  }, []);

  const bannerUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '') + '/uploads/fudbanner.png';

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }
    try {
      const response = await login({ email, password });
      if (response.data.requires2FA) {
        setRequires2FA(true);
        setLoginUserId(response.data.userId);
        toast.info('2FA required');
      } else {
        setAuth(response.data.authorization, response.data.user || null);
        localStorage.setItem('token', response.data.authorization);
        toast.success('Login successful!');
        setTimeout(() => navigate('/home'), 300);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await finalizeLogin({ userId: loginUserId, token: twoFactorToken });
      setAuth(response.data.authorization, response.data.user || null);
      localStorage.setItem('token', response.data.authorization);
      toast.success('Verified!');
      setTimeout(() => navigate('/home'), 300);
    } catch (err) {
      toast.error('Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (res) => {
    setLoading(true);
    try {
      const response = await googleLoginService({ idToken: res.credential });
      setAuth(response.data.authorization, response.data.user || null);
      localStorage.setItem('token', response.data.authorization);
      toast.success('Google login success!');
      setTimeout(() => navigate('/home'), 300);
    } catch (err) {
      toast.error('Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${theme === 'dark' ? 'bg-[#080c1c]' : 'bg-slate-50'} relative overflow-hidden`}>
      <ToastContainer position="top-right" theme={theme} />

      {/* Hero Section with Handoff Image - Left Side */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          src="/assets/Reunite_handoff_image.png"
          alt="Reunite handoff scene"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.target.src = "/assets/fud_main_gate.png"; }}
        />
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-900/75 to-blue-900/30' : 'bg-gradient-to-r from-blue-600/70 to-blue-500/40'}`} />
        
        {/* Left Side Content */}
        <div className="relative z-10 max-w-md text-white text-left px-12 py-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-block"
          >
            <img src="/assets/fud_logo.png" alt="FUD logo" className="w-16 h-16 rounded-xl border-2 border-white/40 shadow-lg" />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-black mb-6 leading-tight"
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-blue-100/95 leading-relaxed"
          >
            Access the secure portal to reunite with your belongings or help others find theirs.
          </motion.p>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-0 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`w-full max-w-md rounded-2xl p-8 md:p-10 shadow-2xl ${theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-xl border border-blue-500/20' : 'bg-white border border-slate-200'}`}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              Sign In
            </motion.h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Continue to your account
            </p>
          </div>

          <AnimatePresence mode="wait">
            {!requires2FA ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSubmit} 
                className="space-y-5"
                autoComplete="off"
              >
                <div className="space-y-2">
                  <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Input
                      type="email"
                      name="fud_portal_email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full h-11 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:bg-white'}`}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setIsForgotModalOpen(true)} 
                      className={`text-xs font-bold hover:underline ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="fud_portal_password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full h-11 rounded-lg border pr-11 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-500 focus:border-blue-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:bg-white'}`}
                      disabled={loading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-11 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Continue to Portal"}
                </Button>

                <div className="relative py-4">
                  <div className={`absolute inset-0 flex items-center border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300'}`} />
                  <div className={`relative flex justify-center text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
                    <span className={`px-4 ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white'}`}>Or continue with</span>
                  </div>
                </div>

                <div className={`h-11 rounded-lg overflow-hidden border2 flex items-center justify-center transition-all ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess} 
                    theme="filled_black" 
                    shape="pill" 
                    width="100%"
                    text="continue_with"
                  />
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="2fa"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handle2FASubmit}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <FiLock className={`text-2xl ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Security Verification
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter the code from your authenticator app
                  </p>
                </div>
                <Input
                  type="text"
                  name="fud_2fa_token"
                  maxLength="6"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  placeholder="000000"
                  className={`text-center text-3xl font-black tracking-[0.2em] h-14 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500'}`}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all" 
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setRequires2FA(false)} 
                  className={`w-full text-xs font-bold uppercase tracking-widest transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  ← Back to login
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              New here?{' '}
              <Link to="/register" className={`font-bold transition-colors ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)}>
        <div className="p-8 md:p-12">
          <div className="mb-8">
            <h3 className={`text-3xl font-black mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              Recover Access
            </h3>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter your university email to receive a password reset code.
            </p>
          </div>

          <form 
            className="space-y-6" 
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              if (!forgotEmail) return toast.error('Please enter your email');
              setLoading(true);
              forgotPassword({ email: forgotEmail })
                .then(() => {
                  toast.success('Recovery link sent!');
                  setTimeout(() => navigate(`/verify-otp?email=${encodeURIComponent(forgotEmail)}&forgot=true`), 1000);
                })
                .catch(err => toast.error('Error processing request'))
                .finally(() => setLoading(false));
            }}
          >
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Email Address
              </label>
              <Input
                type="email"
                name="forgot_email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                className={`h-11 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-blue-500/30 text-white' : 'bg-slate-50 border-slate-300'}`}
                autoComplete="off"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all" 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Recovery Link"}
            </Button>
            <button 
              type="button"
              onClick={() => setIsForgotModalOpen(false)} 
              className={`w-full text-xs font-bold uppercase transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Cancel
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

export default Login;
