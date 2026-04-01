import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead } from '../services/notificationService';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

function Notifications() {
  const { user, loading: authLoading, socket, setUnreadCount } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  // Fetch notifications with error handling
  const fetchNotifications = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }

    setPageLoading(true);
    try {
      const response = await getNotifications({ page, limit });
      setNotifications(response.data.data.notifications || []);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      toast.error(`Failed to load notifications: ${errorMessage}`);
    } finally {
      setPageLoading(false);
    }
  };

  // Socket event handling
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev.slice(0, limit - 1)];
      });
    };

    const handleErrorMessage = (errorMsg) => {
      toast.error(errorMsg);
    };

    socket.on('newNotification', handleNewNotification);
    socket.on('errorMessage', handleErrorMessage);
    fetchNotifications();

    return () => {
      socket.off('newNotification', handleNewNotification);
      socket.off('errorMessage', handleErrorMessage);
    };
  }, [socket, user, page]);

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id, { id: user.id, read: true });
      setNotifications((prev) =>
        prev.map((notif) => (notif._id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(`Failed to mark as read: ${err.response?.data?.error || err.message}`);
    }
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const counts = {
    all: notifications.length,
    unread: notifications.filter(n => !n.isRead).length,
    read: notifications.filter(n => n.isRead).length
  };

  if (authLoading || !user) return <Loader />;

  return (
    <main className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto">
        {/* Header section with Icon */}
        <div className="flex items-center gap-6 mb-12 animate-fade-in-down">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-1" style={{ color: 'var(--color-text)' }}>
              Notifications
            </h1>
            <p className="text-sm font-medium opacity-40">Stay updated on your items</p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-in-down">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${filter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}
          >
            All <span className={`px-2 py-0.5 rounded-lg text-[10px] ${filter === 'all' ? 'bg-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{counts.all}</span>
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${filter === 'unread' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}
          >
            Unread <span className={`px-2 py-0.5 rounded-lg text-[10px] ${filter === 'unread' ? 'bg-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{counts.unread}</span>
          </button>
          <button 
            onClick={() => setFilter('read')}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition flex items-center gap-2 ${filter === 'read' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50'}`}
          >
            Read <span className={`px-2 py-0.5 rounded-lg text-[10px] ${filter === 'read' ? 'bg-blue-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{counts.read}</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in-up">
          {pageLoading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-t-blue-600 border-gray-200 dark:border-slate-700 rounded-full animate-spin mb-4"></div>
              <p className="font-bold tracking-widest text-xs opacity-40">Fetching alerts...</p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredNotifications.map((notif) => (
                <li
                  key={notif._id}
                  className={`p-8 transition group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 cursor-pointer ${!notif.isRead ? 'border-l-4 border-blue-600 bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
                  onClick={() => {
                    // Mark as read if not already
                    if (!notif.isRead) {
                      handleMarkAsRead(notif._id);
                    }

                    // Resolve id safely for populated itemId or raw itemId
                    const resolvedItemId = notif.itemId && typeof notif.itemId === 'object'
                      ? notif.itemId._id
                      : notif.itemId;

                    if (resolvedItemId) {
                      navigate(`/items/${resolvedItemId}`);
                    }
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex-1">
                      <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                        {notif.message}
                      </p>
                      {notif.type === 'smartMatch' && notif.metadata?.matchPercentage && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold rounded-lg">
                            {notif.metadata.matchPercentage}% Match
                          </span>
                          {notif.metadata.otherUserName && (
                            <span className="text-xs opacity-60">
                              with {notif.metadata.otherUserName}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <time className="text-xs font-medium opacity-40">
                          {new Date(notif.createdAt).toLocaleString([], {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </time>
                        {notif.type === 'smartMatch' && (
                          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Click to view match →
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.isRead && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/10"
                      >
                        Mark read
                      </motion.button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-32">
              <div className="text-6xl mb-6 grayscale opacity-20">📭</div>
              <h3 className="text-xl font-bold opacity-40 mb-1">All caught up!</h3>
              <p className="text-sm font-medium opacity-20">No {filter !== 'all' ? filter : ''} notifications to display.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default Notifications;