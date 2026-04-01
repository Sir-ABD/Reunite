// src/pages/Landing.jsx
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { FiLock, FiSearch, FiMessageCircle, FiShield, FiZap, FiUsers, FiBell, FiStar, FiHeart, FiTrendingUp } from 'react-icons/fi';
import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';
import AnimatedBackground from '../components/AnimatedBackground';

const steps = [
  {
    icon: <FiLock size={32} className="text-white" />,
    title: 'Get Access',
    description: 'Log in or create a free account using your university email address',
  },
  {
    icon: <FiSearch size={32} className="text-white" />,
    title: 'Report or Search',
    description: 'Once inside, report a lost item or browse the list of found items',
  },
  {
    icon: <FiMessageCircle size={32} className="text-white" />,
    title: 'Connect',
    description: "We'll help you connect with the person who has your item so you can get it back",
  },
];

const Landing = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const showModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#080c1c]' : 'bg-slate-50'} relative overflow-hidden`} style={{ color: 'var(--color-text)' }}>
      {/* Dynamic Animated Background */}
      <AnimatedBackground />

      {/* Theme Toggle Button */}
      <motion.div 
        className='fixed top-4 right-4 z-50'
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ThemeToggle />
      </motion.div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
      >
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-landing" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-landing)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto py-20">
          {/* Animated Branding */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 relative"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-black tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 dark:from-blue-400 dark:via-purple-400 dark:to-blue-600"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Reunite
            </motion.h1>
            <motion.p
              className="text-sm font-bold tracking-[0.3em] opacity-60"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Federal University Dutse
            </motion.p>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-4xl md:text-6xl font-bold mb-8 leading-tight tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          >
            Find what you lost.<br />
            <motion.span
              className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            >
              Return what you found.
            </motion.span>
          </motion.h2>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={`text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
          >
            Helping you find your belongings and connect with the campus community.
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block ml-1"
            >
              ✨
            </motion.span>
            Simple, fast, and secure.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold py-4 px-10 text-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden group"
              style={{ background: 'var(--color-primary)', color: 'white' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              <span className="relative z-10">Log in</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
              />
            </motion.button>
            <motion.button
              className="rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold py-4 px-10 text-lg shadow-lg hover:shadow-xl bg-white dark:bg-slate-800 border-2 transition-all duration-300 relative overflow-hidden group"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              whileHover={{
                scale: 1.05,
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
            >
              <span className="relative z-10">Create account</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <section className={`py-24 px-4 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>
              How it works
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-blue-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/10 transition-all"
                >
                  {step.icon}
                </motion.div>
                <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{step.title}</h3>
                <p className={`text-base leading-relaxed opacity-70 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-blue-400 mb-4">
              Why choose us?
            </h2>
            <p className="text-base font-medium opacity-60 max-w-2xl mx-auto leading-relaxed">
              Built with students in mind, designed for maximum efficiency and security.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 mx-auto">
                <FiShield size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3">Secure platform</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                Your data is protected with industry-standard encryption.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 mx-auto">
                <FiZap size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3">Lightning fast</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                Find or report items in seconds with our optimized search.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 mx-auto">
                <FiUsers size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3">Community driven</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                Join thousands of students helping each other.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 transition"
            >
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 mx-auto">
                <FiBell size={28} />
              </div>
              <h3 className="text-lg font-bold mb-3">Real-time alerts</h3>
              <p className="text-sm opacity-60 leading-relaxed">
                Get instant notifications when your item is found.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ready to Get Started Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="mb-8 inline-flex p-4 bg-white/10 backdrop-blur-xl rounded-full"
          >
            <FiZap size={32} className="text-white" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
            Ready to get started?
          </h2>
          <p className="text-lg opacity-80 mb-12 max-w-xl mx-auto leading-relaxed">
            Join our campus community today and help make lost items found again. It's completely free!
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link 
              to="/register" 
              className="inline-flex items-center gap-3 px-12 py-5 bg-white text-blue-700 rounded-2xl font-bold text-base shadow-2xl hover:bg-slate-50 transition-all"
            >
              Create free account <span className="text-2xl">→</span>
            </Link>
          </motion.div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      </section>

      {/* Footer */}
      <Footer showModal={showModal} />

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-8 max-w-md w-full shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            >
              <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{modalTitle}</h3>
              <p className={`mb-8 leading-relaxed opacity-70 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{modalContent}</p>
              <button
                onClick={closeModal}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;