// src/pages/Auth/VerifyOtp.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { verifyOtp, resetPassword, forgotPassword } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FiMail, FiLock, FiShield } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from 'framer-motion';

function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const isForgot = searchParams.get('forgot') === 'true';
  const navigate = useNavigate();
  const { login: setAuth } = useContext(AuthContext);

  const bannerUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '') + '/uploads/fudbanner.png';

  useEffect(() => {
    if (!email) {
      toast.error('No email provided for verification');
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!otp) {
      toast.error('Please enter the OTP');
      setLoading(false);
      return;
    }

    if (isForgot) {
      if (!newPassword || !confirmPassword) {
        toast.error('Please enter both new password and confirm password');
        setLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await verifyOtp({ email, otp });
      if (response.status === 200) {
        if (isForgot) {
          await resetPassword({ email, newPassword });
          toast.success('Password reset successfully!');
          setTimeout(() => navigate('/login'), 1500);
        } else {
          setAuth(response.data.authorization, response.data.user);
          localStorage.setItem('token', response.data.authorization);
          toast.success('Account activated!');
          setTimeout(() => navigate('/home'), 500);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('New OTP sent to your email.');
    } catch (err) {
      toast.error('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (!email) return <Loader />;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden selection:bg-blue-500/30">
      <ToastContainer position="top-right" theme="dark" />

      {/* Dynamic Background Banner */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0c]">
        <img 
          src={bannerUrl} 
          alt="Banner" 
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          onError={(e) => {
            e.target.src = "/assets/fud_main_gate.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-[#0a0a0c]/80 to-[#0a0a0c] backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg bg-[#121216]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-2xl mb-6 border border-white/10 shadow-xl"
          >
             <FiShield className="text-3xl text-blue-500" />
          </motion.div>
          <motion.h1 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-white tracking-tight mb-2"
          >
            {isForgot ? 'Secure Reset' : 'Account Security'}
          </motion.h1>
          <motion.p 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-white/40 font-medium text-sm px-4"
          >
            We've sent a 6-digit code to <span className="text-blue-400">{email}</span>. Please verify it to continue.
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">OTP Code</label>
            <Input
              type="text"
              name="otp-verification-code"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000 000"
              className="text-center text-3xl font-black tracking-[0.5em] h-16 bg-white/[0.03] border-white/10 text-white rounded-2xl focus:bg-white/[0.06] transition-all"
              disabled={loading}
              autoFocus
              autoComplete="one-time-code"
            />
          </div>

          <AnimatePresence>
            {isForgot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-2"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new-password-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border-white/10 text-white h-12 rounded-xl pr-12"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                    >
                      {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm-password-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border-white/10 text-white h-12 rounded-xl pr-12"
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                    >
                      {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-black text-lg hover:bg-blue-500 shadow-xl shadow-blue-500/10 active:scale-[0.98] transition-all"
            disabled={loading}
          >
            {loading ? (isForgot ? "Updating..." : "Verifying...") : (isForgot ? "Reset Password" : "Verify OTP")}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResendOtp}
              className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest disabled:opacity-50"
              disabled={loading}
            >
              Resend Code
            </button>
          </div>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
           <button 
             onClick={() => navigate('/login')} 
             className="text-white/30 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
           >
             ← Back to Login
           </button>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyOtp;