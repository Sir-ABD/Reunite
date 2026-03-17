import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

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
      const response = await register({ name, email, password, role: 'user' });
      console.log('Registration response:', response.data);

      // No token is generated yet; proceed to OTP verification
      toast.success('Registration initiated. Please verify OTP to activate your account.');
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.[0]?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in-down" style={{ background: 'var(--color-bg)' }}>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="w-full max-w-md p-8 rounded-xl shadow-lg transform transition-all duration-500 hover:shadow-xl" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
        <h2 className="text-3xl font-bold text-center mb-6 animate-fade-in-down" style={{ color: 'var(--color-text)' }}>Register</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Name</label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50"
              disabled={loading}
            />
          </div>
          <div className="animate-fade-in-left" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50"
              disabled={loading}
            />
          </div>
          <div className="relative animate-fade-in-left" style={{ animationDelay: '0.3s' }}>
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Password</label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
              style={{ color: 'var(--color-accent)' }}
              disabled={loading}
            >
              {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
          <div className="relative animate-fade-in-left" style={{ animationDelay: '0.4s' }}>
            <label htmlFor="confirm-password" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Confirm Password</label>
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="mt-2 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 shadow-sm disabled:opacity-50 pr-12"
              disabled={loading}
            />
            <button
              type="button"
              onClick={toggleConfirmPasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full focus:outline-none mt-4"
              style={{ color: 'var(--color-accent)' }}
              disabled={loading}
            >
              {showConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
          <div className="animate-fade-in-left" style={{ animationDelay: '0.5s' }}>
            <Button
              type="submit"
              className={`w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 shadow-md ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </Button>
          </div>
        </form>
        <p className="mt-4 text-sm text-center animate-fade-in-left" style={{ animationDelay: '0.6s', color: 'var(--color-text)' }}>
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-200">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;