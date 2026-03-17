import { useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

function NotificationsBar() {
  const { notifications, removeNotification } = useContext(AuthContext);

  useEffect(() => {
    // Ensure notifications is an array before processing
    const notifArray = Array.isArray(notifications) ? notifications : [];
    notifArray.forEach((notif) => {
      if (notif.type === 'error') {
        toast.error(notif.message, {
          onClose: () => removeNotification(notif.id),
          autoClose: 5000, // Match the original 5-second auto-dismiss
        });
      } else {
        toast.success(notif.message, {
          onClose: () => removeNotification(notif.id),
          autoClose: 5000, // Match the original 5-second auto-dismiss
        });
      }
    });
  }, [notifications, removeNotification]);

  return null; // No manual rendering needed
}

export default NotificationsBar;