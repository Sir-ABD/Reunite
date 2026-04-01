import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub, FaTwitter, FaLinkedin, FaEnvelope, FaShieldAlt, FaFileContract, FaInfoCircle, FaHome, FaPlusCircle, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="pt-16 pb-8 px-4 sm:px-6 lg:px-8 border-t" style={{ background: 'var(--color-secondary)', borderColor: 'rgba(0,0,0,0.05)', color: 'var(--color-text)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 mb-4">
              <img src="/assets/fud_logo.png" alt="FUD Logo" className="h-10 w-10 object-contain" />
              <span className="text-xl font-bold text-blue-900 dark:text-blue-400 tracking-tight">Reunite</span>
            </div>
            <p className="text-sm font-medium tracking-wide leading-relaxed mb-6 text-slate-500 dark:text-slate-400">
              Federal University Dutse<br />Lost & found portal
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm border border-slate-200 dark:border-slate-700">
                <FaGithub className="text-lg" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-400 hover:text-white transition shadow-sm border border-slate-200 dark:border-slate-700">
                <FaTwitter className="text-lg" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white dark:bg-slate-800 rounded-xl hover:bg-blue-700 hover:text-white transition shadow-sm border border-slate-200 dark:border-slate-700">
                <FaLinkedin className="text-lg" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-bold tracking-widest mb-6 text-slate-400 dark:text-slate-500">Quick navigation</h4>
            <div className="flex flex-col gap-4 text-sm font-medium">
              <Link to="/home" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaHome className="text-blue-500/70" /> Home
              </Link>
              <Link to="/items/create" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaPlusCircle className="text-blue-500/70" /> Post item
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaInfoCircle className="text-blue-500/70" /> Dashboard
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaUser className="text-blue-500/70" /> My profile
              </Link>
            </div>
          </div>

          {/* Support & Legal */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-xs font-bold tracking-widest mb-6 text-slate-400 dark:text-slate-500">Support & legal</h4>
            <div className="flex flex-col gap-4 text-sm font-medium">
              <Link to="/privacy-policy" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaShieldAlt className="text-blue-500/70" /> Privacy policy
              </Link>
              <Link to="/terms-conditions" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaFileContract className="text-blue-500/70" /> Terms & conditions
              </Link>
              <a href="mailto:abdulrazaqisahdikko334@gmail.com" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition">
                <FaEnvelope className="text-blue-500/70" /> Help & support
              </a>
            </div>
          </div>

          {/* Contact & Attribution */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <h4 className="text-xs font-bold tracking-widest mb-6 text-slate-400 dark:text-slate-500">Contact us</h4>
              <motion.a 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="mailto:abdulrazaqisahdikko334@gmail.com" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              >
                <FaEnvelope /> Get in touch
              </motion.a>
              <p className="mt-8 text-[11px] font-bold italic text-slate-400 dark:text-blue-400 tracking-tight leading-tight">
                Developed by<br />
                <span className="text-base text-blue-900 dark:text-white not-italic tracking-normal">Reunite Team (Team 2)</span>
              </p>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-600">
            &copy; {new Date().getFullYear()} Federal University Dutse. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
