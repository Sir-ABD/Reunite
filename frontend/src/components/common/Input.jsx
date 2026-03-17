// src/components/common/Input.jsx
function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      style={{ 
        border: '1px solid var(--color-secondary)', 
        background: 'var(--color-bg)', 
        color: 'var(--color-text)',
        ...(props.disabled && { background: 'var(--color-secondary)' })
      }}
      {...props}
    />
  );
}

export default Input;