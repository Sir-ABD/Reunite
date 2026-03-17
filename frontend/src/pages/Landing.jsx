// src/pages/Home.jsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiSearch, FiMessageCircle } from 'react-icons/fi';
import Footer from '../components/Footer';
import ThemeToggle from '../components/common/ThemeToggle';
import Button from '../components/common/Button';

const steps = [
  {
    icon: <FiLock size={40} className="text-[var(--color-text)]" />,
    title: 'Get Access',
    description: 'Log in or create a free account using your university email address',
  },
  {
    icon: <FiSearch size={40} className="text-[var(--color-text)]" />,
    title: 'Report or Search',
    description: 'Once inside, report a lost item or browse the list of found items',
  },
  {
    icon: <FiMessageCircle size={40} className="text-[var(--color-text)]" />,
    title: 'Connect',
    description: "We'll help you connect with the person who has your item so you can get it back",
  },
];

const Home = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  const showModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 to-indigo-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'}`}>
      {/* Theme Toggle Button */}
      <div className='fixed top-4 right-4 z-50'>
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative min-h-screen flex items-center justify-center px-4"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e40af" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <svg className="w-24 h-24 mx-auto text-university-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
            </svg>
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className={`text-5xl md:text-6xl font-bold mb-6 leading-tight ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
          >
            Lost something?<br />
            <span className="text-university-blue">Found something?</span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className={`text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Helping you find your belongings and connect with the campus community
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.button
              className="rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold py-4 px-8 text-lg shadow-lg hover:shadow-xl min-w-48 hover:opacity-90 transition-all duration-300"
              style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
            >
              Log In
            </motion.button>
            <motion.button
              className="rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold py-4 px-8 text-lg shadow-lg hover:shadow-xl min-w-48 bg-transparent border-2 transition-all duration-300"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              whileHover={{ scale: 1.05, backgroundColor: 'var(--color-primary)', color: 'var(--color-text)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
            >
              Create Account
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      {/* How It Works Section */}
      <div className={`py-20 px-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`text-4xl font-bold text-center mb-16 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
          >
            How It Works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="bg-university-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 bg-[var(--color-primary)]">
                  {step.icon}
                </div>
                <h3 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{step.title}</h3>
                <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-lg p-8 max-w-md mx-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
            >
              <h3 className={`text-xl font-semibold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{modalTitle}</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{modalContent}</p>
              <button
                onClick={closeModal}
                className="bg-university-blue text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors"
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

export default Home;