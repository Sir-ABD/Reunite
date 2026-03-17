import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { updateUserProfile, updateUserPassword, deleteUserAccount } from '../services/userService';
import Loader from '../components/common/Loader';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Profile() {
  const { user, setUser, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // State for password update form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // State for name and email update form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Toggle states for forms
  const [isFormOpen, setIsFormOpen] = useState(null);

  // Derive displayData directly from user
  const displayData = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'user',
  };

  useEffect(() => {
    console.log('Profile component - Current user:', user, 'Token:', token);
    if (!user && !token) {
      console.log('No user or token, redirecting to login');
      navigate('/login');
    }
  }, [user, token, navigate]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New password and confirm password do not match');
        return;
      }

      await updateUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsFormOpen(null);
    } catch (err) {
      console.error('Password Update Error:', err);
      toast.error('Failed to update password: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate token before request
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending profile update:', profileForm, 'Token:', token);
      const response = await updateUserProfile({
        name: profileForm.name,
        email: profileForm.email,
      });
      console.log('API Response:', response);

      // Handle backend response structure
      const updatedUser = response.data.user;
      console.log('Extracted updated user:', updatedUser);

      // Validate updatedUser
      if (!updatedUser || !updatedUser.name || !updatedUser.email) {
        throw new Error('Invalid user data returned from API');
      }

      toast.success('Profile updated successfully!');
      setUser({ ...user, ...updatedUser }); // Update AuthContext
      setProfileForm({ name: updatedUser.name, email: updatedUser.email }); // Sync form
    } catch (err) {
      console.error('Profile Update Error:', err);
      const errorMessage = err.response?.data?.error || err.message;
      if (err.response?.status === 401) {
        console.log('Unauthorized error, token may be invalid');
        toast.error('Session expired. Please log in again.');
        setUser(null);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error('Failed to update profile: ' + errorMessage);
      }
    } finally {
      console.log('Closing profile form, isFormOpen before:', isFormOpen);
      setIsFormOpen(null);
      console.log('isFormOpen after:', isFormOpen);
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteUserAccount();
        toast.success('Account deactivated successfully!');
        setUser(null);
        navigate('/login');
      } catch (err) {
        console.error('Delete Account Error:', err);
        toast.error('Failed to delete account: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleForm = (formType) => {
    setIsFormOpen((prev) => (prev === formType ? null : formType));
  };

  if (!user && !token) return <Loader />;

  return (
    <div style={{ background: 'var(--color-bg)', color: 'var(--color-text)', minHeight: '100vh' }}>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-center" style={{ color: 'var(--color-text)' }}>User Profile</h1>
          </div>

          {/* Read-Only User Details */}
          <div className="p-6 rounded-lg shadow-md mb-6" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
            <div className="space-y-4">
              <p className="text-lg sm:text-xl" style={{ color: 'var(--color-text)' }}><strong>Name:</strong> {displayData.name}</p>
              <p className="text-lg sm:text-xl" style={{ color: 'var(--color-text)' }}><strong>Email:</strong> {displayData.email}</p>
              <p className="text-lg sm:text-xl" style={{ color: 'var(--color-text)' }}><strong>Role:</strong> {displayData.role}</p>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => toggleForm('profile')}
                className="w-full sm:w-auto py-2 px-4 rounded-md transition-colors"
                style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                Update Name & Email
              </Button>
              <Button
                onClick={() => toggleForm('password')}
                className="w-full sm:w-auto py-2 px-4 rounded-md transition-colors"
                style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                Update Password
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto py-2 px-4 rounded-md transition-colors"
                style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full sm:w-auto py-2 px-4 rounded-md transition-colors"
                style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>

          {/* Update Name & Email Form */}
          {isFormOpen === 'profile' && (
            <div className="p-6 rounded-lg shadow-md mb-6" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Update Name & Email</h2>
              </div>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Name:</label>
                  <Input
                    id="name"
                    label=""
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Email:</label>
                  <Input
                    id="email"
                    label=""
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md transition-colors" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={() => setIsFormOpen(null)}
                    className="w-full py-2 px-4 rounded-md transition-colors"
                    style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Update Password Form */}
          {isFormOpen === 'password' && (
            <div className="p-6 rounded-lg shadow-md mb-6" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Update Password</h2>
              </div>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="relative">
                  <label htmlFor="currentPassword" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Current Password:</label>
                  <Input
                    id="currentPassword"
                    label=""
                    name="currentPassword"
                    type={showPassword.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('currentPassword')}
                    className="absolute top-8 right-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {showPassword.currentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="relative">
                  <label htmlFor="newPassword" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>New Password:</label>
                  <Input
                    id="newPassword"
                    label=""
                    name="newPassword"
                    type={showPassword.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('newPassword')}
                    className="absolute top-8 right-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {showPassword.newPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="relative">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium" style={{ color: 'var(--color-text)' }}>Confirm Password:</label>
                  <Input
                    id="confirmPassword"
                    label=""
                    name="confirmPassword"
                    type={showPassword.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    className="absolute top-8 right-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {showPassword.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="flex gap-4">
                  <Button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-md transition-colors" style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}>
                    {loading ? 'Saving...' : 'Update Password'}
                  </Button>
                  <Button
                    onClick={() => setIsFormOpen(null)}
                    className="w-full py-2 px-4 rounded-md transition-colors"
                    style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;