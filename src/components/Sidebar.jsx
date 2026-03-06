import React, { useState } from 'react';
import { BookOpen, Clock, TrendingUp, GraduationCap, LogOut, Settings, Shield, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeContext';

const wiggleStyle = document.getElementById('sidebar-wiggle-style') || (() => {
  const s = document.createElement('style');
  s.id = 'sidebar-wiggle-style';
  s.textContent = `
    .sidebar-btn:hover .sidebar-icon {
      animation: sidebar-wiggle 0.4s ease-in-out;
    }
    @keyframes sidebar-wiggle {
      0% { transform: rotate(0deg); }
      25% { transform: rotate(-12deg); }
      50% { transform: rotate(8deg); }
      75% { transform: rotate(-4deg); }
      100% { transform: rotate(0deg); }
    }
  `;
  document.head.appendChild(s);
  return s;
})();

const NAV_ITEMS = [
  { id: 'grade', label: 'Grade Curricular', icon: BookOpen },
  { id: 'emCurso', label: 'Em Curso', icon: Clock },
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'formatura', label: 'Formatura', icon: GraduationCap },
];

export default function Sidebar({
  activeTab, setActiveTab,
  user, userName,
  onOpenSettings, onOpenLogout, onOpenAdmin,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const primeiroNome = userName ? userName.split(' ')[0] : user?.email?.split('@')[0];

  const sidebarContent = (
    <>
      {/* Brand + User */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-default">
          <img src="/icon-192.png" alt="Semestry" className="w-6 h-6 rounded-md flex-shrink-0" style={{ filter: 'var(--accent-icon-filter)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[var(--text-primary)] leading-tight">Semestry</p>
            <p className="text-[11px] text-[var(--text-muted)] truncate leading-tight">{primeiroNome}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`sidebar-btn w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-colors ${
                activeTab === item.id
                  ? 'text-[var(--text-primary)] bg-[var(--bg-hover)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <item.icon size={16} className="sidebar-icon flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-3 space-y-0.5">
        <button onClick={toggleTheme} className="sidebar-btn w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
          {isDark ? <Sun size={16} className="sidebar-icon flex-shrink-0" /> : <Moon size={16} className="sidebar-icon flex-shrink-0" />}
          {isDark ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button onClick={() => { onOpenSettings(); setMobileOpen(false); }} className="sidebar-btn w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
          <Settings size={16} className="sidebar-icon flex-shrink-0" />
          Configurações
        </button>
        {onOpenAdmin && (
          <button onClick={() => { onOpenAdmin(); setMobileOpen(false); }} className="sidebar-btn w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            <Shield size={16} className="sidebar-icon flex-shrink-0" />
            Painel Admin
          </button>
        )}
        <div className="border-t border-[var(--border-card)] mt-1 pt-1">
          <button onClick={() => { onOpenLogout(); setMobileOpen(false); }} className="sidebar-btn w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] text-red-400/70 hover:text-red-400 hover:bg-[var(--bg-hover)] transition-colors">
            <LogOut size={16} className="sidebar-icon flex-shrink-0" />
            Sair
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3.5 left-4 z-40 p-2 rounded-md bg-[var(--bg-card)] border border-[var(--border-card)] lg:hidden"
      >
        <Menu size={16} className="text-[var(--text-primary)]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-60 h-full bg-[var(--bg-root)] border-r border-[var(--border-card)] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-3 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={16} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-52 h-screen fixed left-0 top-0 flex-col bg-[var(--bg-root)] border-r border-[var(--border-card)] z-30">
        {sidebarContent}
      </aside>
    </>
  );
}
