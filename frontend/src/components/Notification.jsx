function Notification({ notification }) {
  return (
    <div className="p-2 border-b" style={{ background: 'var(--color-secondary)', color: 'var(--color-text)' }}>
      <p>{notification.message}</p>
      <span className="text-sm" style={{ color: 'var(--color-accent)' }}>{new Date(notification.createdAt).toLocaleString()}</span>
    </div>
  );
}

export default Notification;
