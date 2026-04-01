// src/components/common/Input.jsx
function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-white/20 transition-all ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    />
  );
}

export default Input;