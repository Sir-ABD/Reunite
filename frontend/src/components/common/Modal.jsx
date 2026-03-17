function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="p-4 rounded shadow-lg" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <button onClick={onClose} className="text-red-500 float-right">X</button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
