import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaHome, FaBell, FaPlus, FaComments, FaTachometerAlt, FaShieldAlt, FaUserShield } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './common/ThemeToggle';


function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, token, logout, loading, isAdmin, unreadCount, unreadMessagesCount } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  const navLinks = [
    { to: '/home', label: 'Home', icon: <FaHome /> },
    { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
    { to: '/items/create', label: 'Post Item', icon: <FaPlus /> },
    { to: '/conversations', label: 'Conversations', icon: <FaComments /> },
    { to: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { to: '/keepers', label: 'Keepers', icon: <FaUserShield /> },
  ];

  if (isAdmin) {
    navLinks.push({ to: '/admin', label: 'Admin', icon: <FaShieldAlt /> });
  }

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setProfileOpen(false);
    navigate('/login');
  };

  const handleProfileClick = () => {
    setProfileOpen(!profileOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div className="bg-blue-600 text-white p-4 animate-pulse">Loading...</div>;
  }

  return (
    <nav className="sticky top-0 left-0 w-full z-50 shadow-md border-b border-gray-100 dark:border-slate-800 h-16 sm:h-20 transition-colors" style={{ background: 'var(--color-navbar)' }}>
      <div className="max-w-screen-xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/home" className="flex items-center gap-2 group">
          <img src="/assets/fud_logo.png" alt="FUD Logo" className="h-10 w-10 sm:h-12 sm:w-12 object-contain" />
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-tighter leading-none">Federal University Dutse</span>
            <span className="text-lg font-black text-blue-900 dark:text-blue-400 leading-none tracking-tighter">Reunite</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2 h-full">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-2 text-xs lg:text-sm font-bold transition-all rounded-xl flex items-center gap-2 ${
                location.pathname === link.to 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Icons and Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {token ? (
            <>
              <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/conversations" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
                <FaComments className="text-xl" />
                {unreadMessagesCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                  </span>
                )}
              </Link>
              <div className="relative" ref={profileRef}>
                <button onClick={handleProfileClick} className="flex items-center gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-900 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md overflow-hidden hover:scale-105 transition">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </div>
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                      <FaUser className="opacity-50" /> Profile settings
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-gray-50 flex items-center gap-3">
                        <FaShieldAlt className="opacity-50" /> Admin panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-bold text-red-600 hover:bg-gray-50 flex items-center gap-3">
                      <FaSignOutAlt className="opacity-50" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="px-4 py-2 text-xs font-bold rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition">Log in</Link>
              <Link to="/register" className="px-4 py-2 text-xs font-bold rounded-md bg-blue-900 text-white hover:bg-blue-800 transition">Register</Link>
            </div>
          )}
          <ThemeToggle className="ml-1" />
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-xl z-50">
          <div className="flex flex-col py-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`px-6 py-3 text-sm font-bold flex items-center gap-3 ${
                  location.pathname === link.to ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
            {token && (
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-sm font-bold text-red-600 flex items-center gap-3"
              >
                <FaSignOutAlt /> Sign out
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
