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
    <div className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--bg-modal)] border border-[var(--border-input)] rounded-lg p-5 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-bg10)] flex items-center justify-center">
            <Share2 size={20} style={{ color: 'var(--accent-400)' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Compartilhar Grade</h2>
            <p className="text-[var(--text-muted)] text-xs">Gere um link público da sua grade</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw size={20} className="animate-spin" style={{ color: 'var(--accent-400)' }} />
          </div>
        ) : error ? (
          <div className="py-3">
            <p className="text-xs text-red-400 mb-2">{error}</p>
            <button onClick={loadToken} className="text-xs hover:underline" style={{ color: 'var(--accent-400)' }}>Tentar novamente</button>
          </div>
        ) : token ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)]">
              <Link size={14} className="shrink-0" style={{ color: 'var(--accent-400)' }} />
              <span className="text-xs text-[var(--text-secondary)] truncate flex-1">{shareUrl}</span>
              <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors shrink-0">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-[var(--text-muted)]" />}
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              Qualquer pessoa com este link pode ver sua grade (somente leitura).
            </p>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-red-500/8 text-red-400 hover:bg-red-500/15 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {revoking ? 'Revogando...' : 'Revogar Link'}
            </button>
          </div>
        ) : (
          <div className="text-center py-3">
            <p className="text-xs text-[var(--text-muted)] mb-2">Nenhum link ativo.</p>
            <button onClick={loadToken} className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-[var(--accent-bg10)]" style={{ color: 'var(--accent-400)' }}>
              Gerar Novo Link
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full mt-3 py-2 rounded-md bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-hover)] transition-colors">
          Fechar
        </button>
      </div>
    </div>
  );
}
