export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-[var(--bg-card)] dark:backdrop-blur-xl
        border border-[var(--border-card)]
        shadow-[var(--shadow-card)]
        transition-all duration-300
        ${hover ? 'hover:bg-[var(--bg-card-hover)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
