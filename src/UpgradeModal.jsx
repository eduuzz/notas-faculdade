import React, { useState } from 'react';
import { X, Check, Crown, Star, Zap, Copy, CheckCircle, Upload, ArrowRight, Sparkles, Gift } from 'lucide-react';
import { supabase } from './supabaseClient';

const CONFIG = {
  chavePix: 'notasedu.pix@gmail.com',
  whatsapp: '5551989929557',
  whatsappFormatado: '(51) 98992-9557'
};

const PLANOS = {
  pro: {
    id: 'pro',
    nome: 'Pro',
    icon: Star,
    gradient: 'from-violet-500 to-indigo-600',
    shadow: 'shadow-violet-500/30',
    border: 'border-violet-500/50',
    bg: 'bg-violet-500/10',
    precos: { mensal: 4.90, semestral: 19.90, anual: 34.90 },
    funcionalidades: ['Disciplinas ilimitadas', 'Dashboard completo', 'Exportar PDF', 'Previsão de formatura']
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    icon: Crown,
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    precos: { mensal: 9.90, semestral: 39.90, anual: 69.90 },
    funcionalidades: ['Tudo do Pro', 'Simulador de notas', 'Múltiplos cursos', 'PDF com gráficos', 'Backup/Exportar dados', 'Suporte prioritário']
  }
};

export default function UpgradeModal({ planoAtual, userEmail, userName, onClose }) {
  const [periodo, setPeriodo] = useState('semestral');
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [etapa, setEtapa] = useState('selecao');
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filtrar planos disponíveis para upgrade
  const planosDisponiveis = Object.values(PLANOS).filter(p => {
    if (planoAtual === 'gratuito' || planoAtual === 'basico') return true; // Pode escolher Pro ou Premium
    if (planoAtual === 'pro') return p.id === 'premium'; // Só Premium
    return false; // Admin/Premium não precisa de upgrade
  });

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CONFIG.chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSelecionarPlano = (planoId) => {
    setPlanoSelecionado(planoId);
    setEtapa('pagamento');
  };

  const handleEnviarPedido = async () => {
    setLoading(true);
    try {
      const plano = PLANOS[planoSelecionado];
      const preco = plano.precos[periodo];

      await supabase.from('pedidos').insert([{
        nome: userName || 'Usuário',
        email: userEmail.toLowerCase(),
        status: 'PENDENTE',
        plano: planoSelecionado,
        periodo: periodo,
        valor: preco,
        tipo: 'UPGRADE'
      }]);

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Erro:', err);
    }
    setLoading(false);
  };

  // Tela de sucesso
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pedido enviado!</h2>
          <p className="text-slate-400 mb-6">
            Seu upgrade será processado em até 24h após confirmação do pagamento.
          </p>
          <div className="text-sm text-slate-500">Fechando...</div>
        </div>
      </div>
    );
  }

  // Tela de pagamento
  if (etapa === 'pagamento' && planoSelecionado) {
    const plano = PLANOS[planoSelecionado];
    const preco = plano.precos[periodo];
    const Icon = plano.icon;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setEtapa('selecao')} className="text-slate-400 hover:text-white text-sm">
              ← Voltar
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          {/* Plano selecionado */}
          <div className={`${plano.bg} border ${plano.border} rounded-2xl p-4 mb-6`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plano.gradient} flex items-center justify-center`}>
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Upgrade para {plano.nome}</h3>
                <p className="text-slate-400 text-sm capitalize">{periodo}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">R$ {preco.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>

          {/* Pix */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-400 mb-3">Pague via Pix</h4>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">Chave Pix (Email)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-white bg-black/30 px-3 py-2 rounded-lg text-sm font-mono truncate">
                  {CONFIG.chavePix}
                </code>
                <button
                  onClick={copiarChavePix}
                  className={`p-2 rounded-lg transition-all ${copiado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  {copiado ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Botão */}
          <button
            onClick={handleEnviarPedido}
            disabled={loading}
            className={`w-full py-4 rounded-xl bg-gradient-to-r ${plano.gradient} font-semibold shadow-lg ${plano.shadow} transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {loading ? 'Enviando...' : (
              <>
                <Upload size={18} />
                Já fiz o Pix - Confirmar Upgrade
              </>
            )}
          </button>

          {/* WhatsApp */}
          <div className="mt-4 text-center">
            <p className="text-slate-500 text-xs mb-1">Ou envie o comprovante pelo WhatsApp</p>
            <a
              href={`https://wa.me/${CONFIG.whatsapp}?text=Olá! Quero fazer upgrade para o plano ${plano.nome} (${periodo}). Meu email: ${userEmail}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
            >
              {CONFIG.whatsappFormatado}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Tela de seleção de plano
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Fazer Upgrade</h2>
              <p className="text-slate-400 text-sm">Desbloqueie mais funcionalidades</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Seletor de período */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10">
            {[
              { id: 'mensal', label: 'Mensal' },
              { id: 'semestral', label: 'Semestral', badge: '33% OFF' },
              { id: 'anual', label: 'Anual', badge: '41% OFF' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  periodo === p.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
                {p.badge && periodo === p.id && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {p.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de planos */}
        <div className={`grid gap-4 ${planosDisponiveis.length === 1 ? 'max-w-sm mx-auto' : 'md:grid-cols-2'}`}>
          {planosDisponiveis.map((plano) => {
            const Icon = plano.icon;
            const preco = plano.precos[periodo];

            return (
              <div
                key={plano.id}
                className={`relative rounded-2xl p-6 ${plano.bg} border ${plano.border} transition-all hover:scale-[1.02] flex flex-col`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plano.gradient} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{plano.nome}</h3>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">R$ {preco.toFixed(2).replace('.', ',')}</span>
                  <span className="text-slate-400 text-sm">/{periodo === 'mensal' ? 'mês' : periodo === 'semestral' ? 'sem' : 'ano'}</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plano.funcionalidades.map((func, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check size={14} className="text-emerald-400 flex-shrink-0" />
                      {func}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelecionarPlano(plano.id)}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${plano.gradient} text-white font-semibold shadow-lg ${plano.shadow} transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-auto`}
                >
                  Fazer Upgrade
                  <ArrowRight size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Plano atual */}
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-slate-500 text-sm">
            Seu plano atual: <span className="text-white font-medium capitalize">{planoAtual}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
