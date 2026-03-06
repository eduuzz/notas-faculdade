const variants = {
  primary: 'bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  secondary: 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)] text-[var(--text-secondary)]',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  purple: 'bg-purple-600 hover:bg-purple-700 text-white'
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm'
};

export default function GradientButton({ children, onClick, disabled, variant = 'primary', className = '', size = 'md' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 rounded-lg font-medium
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}
