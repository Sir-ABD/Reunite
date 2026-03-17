// src/components/common/Button.jsx
function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={{ background: 'var(--color-primary)', color: 'var(--color-text)' }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;