import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { register } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin as googleLoginService } from '../../services/authService';
import { motion } from 'framer-motion';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login: setAuth } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();

  const bannerUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '') + '/uploads/fudbanner.png';

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      await register({ name, email, password, role: 'user' });
      toast.success('Registration initiated. Verify OTP.');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
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
      toast.success('Joined successfully!');
      setTimeout(() => navigate('/home'), 300);
    } catch (err) {
      toast.error('Google Sign-In failed.');
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
        <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-900/75 to-purple-900/30' : 'bg-gradient-to-r from-purple-600/70 to-purple-500/40'}`} />
        
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
            Join Reunite
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-purple-100/95 leading-relaxed"
          >
            Create your account and become part of the campus community that helps reunite belongings.
          </motion.p>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-0 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`w-full max-w-md rounded-2xl p-8 md:p-10 shadow-2xl ${theme === 'dark' ? 'bg-slate-900/80 backdrop-blur-xl border border-purple-500/20' : 'bg-white border border-slate-200'}`}
        >
          <div className="text-center mb-8">
            <motion.h1 
              className={`text-3xl font-black mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            >
              Create Account
            </motion.h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Join the FUD Reunite community
            </p>
          </div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onSubmit={handleSubmit} 
            className="space-y-4" 
            autoComplete="off"
          >
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Full Name
              </label>
              <Input
                type="text"
                name="user_full_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abdulrazaq Isah"
                className={`w-full h-11 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder:text-slate-500 focus:border-purple-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-purple-500 focus:bg-white'}`}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                Email Address
              </label>
              <Input
                type="email"
                name="user_email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={`w-full h-11 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder:text-slate-500 focus:border-purple-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-purple-500 focus:bg-white'}`}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="user_password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-11 rounded-lg border pr-10 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder:text-slate-500 focus:border-purple-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-purple-500 focus:bg-white'}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="user_password_confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full h-11 rounded-lg border pr-10 transition-all ${theme === 'dark' ? 'bg-slate-800/50 border-purple-500/30 text-white placeholder:text-slate-500 focus:border-purple-500/60 focus:bg-slate-800/70' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-purple-500 focus:bg-white'}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full h-11 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${theme === 'dark' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800' : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800'}`}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
          </motion.form>

          <div className="relative py-4">
            <div className={`absolute inset-0 flex items-center border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-300'}`} />
            <div className={`relative flex justify-center text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-slate-500' : 'text-slate-600'}`}>
              <span className={`px-4 ${theme === 'dark' ? 'bg-slate-900/80' : 'bg-white'}`}>Or sign up with</span>
            </div>
          </div>

          <div className={`h-11 rounded-lg overflow-hidden border flex items-center justify-center transition-all ${theme === 'dark' ? 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              theme="filled_black" 
              shape="pill" 
              width="100%"
              text="signup_with"
            />
          </div>

          <div className="mt-8 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Already have an account?{' '}
              <Link to="/login" className={`font-bold transition-colors ${theme === 'dark' ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Register;
