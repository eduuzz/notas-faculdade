import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, Trash2, Link, RefreshCw } from 'lucide-react';
import { getOrCreateShareToken, revokeShareToken } from '../../utils/share';

export default function ShareModal({ userId, onClose }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState(null);

  const shareUrl = token ? `${window.location.origin}/share/${token}` : '';

  useEffect(() => {
    loadToken();
  }, []);

  async function loadToken() {
    setLoading(true);
    setError(null);
    try {
      const t = await getOrCreateShareToken(userId);
      setToken(t);
    } catch (err) {
      setError('Erro ao gerar link. A tabela shared_grades pode nao existir no Supabase.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleRevoke() {
    setRevoking(true);
    try {
      await revokeShareToken(userId);
      setToken(null);
    } catch {
      setError('Erro ao revogar link.');
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--accent-500), var(--accent-600))' }}>
            <Share2 size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Compartilhar Grade</h2>
            <p className="text-[var(--text-secondary)] text-sm">Gere um link publico da sua grade</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
          </div>
        ) : error ? (
          <div className="py-4">
            <p className="text-sm text-red-400 mb-3">{error}</p>
            <button onClick={loadToken} className="text-sm hover:underline" style={{ color: 'var(--accent-400)' }}>Tentar novamente</button>
          </div>
        ) : token ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)]">
              <Link size={16} className="shrink-0" style={{ color: 'var(--accent-400)' }} />
              <span className="text-sm text-[var(--text-secondary)] truncate flex-1">{shareUrl}</span>
              <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-all shrink-0">
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-[var(--text-muted)]" />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Qualquer pessoa com este link pode ver sua grade (somente leitura).
            </p>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              {revoking ? 'Revogando...' : 'Revogar Link'}
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--text-secondary)] mb-3">Nenhum link ativo.</p>
            <button onClick={loadToken} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: 'var(--accent-bg10)', color: 'var(--accent-400)' }}>
              Gerar Novo Link
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full mt-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] transition-colors text-sm">
          Fechar
        </button>
      </div>
    </div>
  );
}
