import { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { verifyOtp, resetPassword, forgotPassword } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
          toast.success('Password reset successfully. Redirecting to login...');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          // Registration verification successful
          setAuth(response.data.authorization, response.data.user);
          localStorage.setItem('token', response.data.authorization);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          toast.success('Account verified and activated. Redirecting to dashboard...');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.status === 400
          ? err.response?.data?.message || 'Invalid or expired OTP'
          : err.response?.status === 404
          ? 'User not found'
          : err.response?.status === 500
          ? 'Server error, please try again later'
          : 'An unexpected error occurred';
      toast.error(errorMsg);
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
      toast.error('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (!email) return <Loader />;

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-down" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md p-8 rounded-xl shadow-lg border transform transition-all duration-500 hover:shadow-2xl" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)', borderColor: 'var(--color-secondary)' }}>
        <h2 className="text-3xl font-bold text-center mb-6 animate-fade-in-down" style={{ color: 'var(--color-text)' }}>
          {isForgot ? 'Verify OTP & Reset Password' : 'Verify OTP'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="otp" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>OTP</label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50"
              disabled={loading}
              aria-label="Enter OTP"
            />
          </div>
          {isForgot && (
            <>
              <div className="relative animate-fade-in-left" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="new-password" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>New Password</label>
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
                  disabled={loading}
                  aria-label="Enter new password"
                />
                <button
                  type="button"
                  onClick={toggleNewPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
                  style={{ color: 'var(--color-accent)' }}
                  disabled={loading}
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative animate-fade-in-left" style={{ animationDelay: '0.3s' }}>
                <label htmlFor="confirm-password" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Confirm Password</label>
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
                  disabled={loading}
                  aria-label="Confirm new password"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
                  style={{ color: 'var(--color-accent)' }}
                  disabled={loading}
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
            </>
          )}
          <div className="animate-fade-in-left" style={{ animationDelay: '0.4s' }}>
            <Button
              type="submit"
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 shadow-md ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isForgot ? 'Resetting...' : 'Verifying...'}
                </span>
              ) : (
                isForgot ? 'Reset Password' : 'Verify OTP'
              )}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center animate-fade-in-left" style={{ animationDelay: '0.5s', color: 'var(--color-text)' }}>
          Didn't receive an OTP?{' '}
          <button
            onClick={handleResendOtp}
            className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors duration-200"
            disabled={loading}
            aria-label="Resend OTP"
          >
            Resend OTP
          </button>
        </p>
      </div>
    </div>
  );
}

export default VerifyOtp;