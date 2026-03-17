import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaHome, FaBell, FaPlus, FaComments, FaTachometerAlt, FaShieldAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './common/ThemeToggle';


function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, token, logout, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const userInitial = user?.name?.charAt(0).toUpperCase() || 'U';

  const navLinks = [
    { to: '/home', label: 'Home', icon: <FaHome /> },
    { to: '/notifications', label: 'Notifications', icon: <FaBell /> },
    { to: '/items/create', label: 'Post Item', icon: <FaPlus /> },
    { to: '/conversations', label: 'Conversations', icon: <FaComments /> },
    { to: '/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
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
    <nav className="sticky bg-blue-700 text-white  shadow-md top-0 left-0 w-full z-50">
      <div className="max-w-screen-xl mx-auto py-4 px-4 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
          <img src="/assets/fud_logo.png" alt="FUD Logo" className="h-10 w-10 object-contain rounded-full bg-white p-1" />
          Reunite
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex md:gap-3 lg:gap-4 items-center">
          {token && navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`group flex items-center gap-2 hover:text-blue-200 transition relative px-2 py-1 rounded ${location.pathname === link.to ? 'underline font-semibold' : ''}`}
            >
              <span className="text-lg hidden lg:inline">{link.icon}</span>
              <span className="hidden md:inline transition duration-200 text-sm">
                {link.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">

          {token ? (
            <>
              {/* Profile button */}
              <div className="relative hidden md:block" ref={profileRef}>
                <button
                  onClick={handleProfileClick}
                  className="w-10 h-10 bg-blue-800 rounded-full text-white font-bold flex items-center justify-center hover:ring-2 hover:ring-blue-300 transition"
                >
                  {userInitial}
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-lg z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileOpen(false);
                      }}
                      className="w-full px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                    >
                      <FaUser /> Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 hover:bg-gray-100 text-sm flex items-center gap-2"
                    >
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className='hidden md:flex gap-4 items-center'>
              <Link to="/login" className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800">Login</Link>
              <Link to="/register" className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800">Register</Link>
            </div>
          )}

          {/* Theme toggle + Hamburger */}
          <ThemeToggle className="ml-2 w-8 h-8 p-1" />
          <button
            className="md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && <div className="fixed inset-0 bg-gray-800/50 z-40 md:hidden" onClick={() => setMenuOpen(false)}></div>}

      {/* Mobile Menu */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-blue-700 text-white transform ${menuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 md:hidden shadow-2xl backdrop-filter backdrop-blur-md`}>
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-blue-600">
          <h2 className="text-xl font-bold">Reunite</h2>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col h-full">
          {/* Navigation Links */}
          <div className="p-4">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-blue-600 ${location.pathname === link.to ? 'bg-blue-600 shadow-md border-l-4 border-blue-300' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom Section - User Actions */}
          {token && (
            <div className="bottom-0 absolute w-full border-t border-blue-600 p-4 space-y-2">
              {/* Profile Button */}
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-blue-600 rounded-lg transition-all duration-200 text-sm"
              >
                <FaUser className="text-base" />
                <span>Profile</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <FaSignOutAlt className="text-base" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
