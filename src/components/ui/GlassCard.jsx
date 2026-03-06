export default function GlassCard({ children, className = '', hover = true, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg
        bg-[var(--bg-card)]
        border border-[var(--border-card)]
        transition-colors duration-150
        ${hover ? 'hover:bg-[var(--bg-card-hover)] cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
