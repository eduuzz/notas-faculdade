const variants = {
  primary: '',
  success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/25',
  danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/25',
  secondary: 'bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] border border-[var(--border-input)]',
  amber: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25',
  purple: 'bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 shadow-lg shadow-purple-500/25'
};

const sizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-3.5 text-base'
};

export default function GradientButton({ children, onClick, disabled, variant = 'primary', className = '', size = 'md' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center gap-2 rounded-xl font-medium
        transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      style={variant === 'primary' ? { background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))', boxShadow: '0 10px 15px -3px var(--accent-ring)', color: 'white' } : {}}
    >
      {children}
    </button>
  );
}
