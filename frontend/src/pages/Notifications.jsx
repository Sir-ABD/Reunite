import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationAsRead } from '../services/notificationService';
import Loader from '../components/common/Loader';
import Pagination from '../components/common/Pagination';
import { toast } from 'react-toastify';

function Notifications() {
  const { user, loading: authLoading, socket } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

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
      // Optionally add toast.success if desired
      // toast.success('Notification marked as read!');
    } catch (err) {
      toast.error(`Failed to mark as read: ${err.response?.data?.error || err.message}`);
    }
  };

  // Pagination handler
  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading || !user) return <Loader />;

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <header className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl animate-fade-in-down" style={{ color: 'var(--color-text)' }}>
          Notifications
        </h1>
      </header>

      {/* Loading State */}
      {pageLoading && notifications.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      ) : notifications.length > 0 ? (
        <section className="rounded-xl shadow-md overflow-hidden animate-fade-in-down" style={{ background: 'var(--color-secondary)' }}>
          <ul className="divide-y" style={{ borderColor: 'var(--color-secondary)' }}>
            {notifications.map((notif) => (
              <li
                key={notif._id}
                className={`p-4 transition-colors duration-200 ${
                  notif.isRead ? '' : ''
                } animate-fade-in-left`}
                style={{ 
                  background: notif.isRead ? 'var(--color-secondary)' : 'var(--color-primary)',
                  color: 'var(--color-text)'
                }}
                role="region"
                aria-label={`Notification: ${notif.message}`}
              >
                <div className="flex flex-col space-y-2">
                  <p className="text-sm md:text-base break-words" style={{ color: 'var(--color-text)' }}>
                    {notif.message}
                  </p>
                  <time
                    className="text-xs md:text-sm"
                    style={{ color: 'var(--color-text)' }}
                    dateTime={notif.createdAt}
                  >
                    {new Date(notif.createdAt).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </time>
                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="self-start px-3 py-1 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
                      style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
                      aria-label={`Mark notification ${notif.message} as read`}
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </section>
      ) : (
        <p className="text-center py-12 animate-fade-in-down" style={{ color: 'var(--color-text)' }}>
          No notifications available
        </p>
      )}
    </main>
  );
}

export default Notifications;