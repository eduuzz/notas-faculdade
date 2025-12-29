import React, { useState } from 'react';
import { Check, X, ArrowLeft, Zap, Crown, Star, Sparkles, Copy, CheckCircle, Upload, User, Mail, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

// Configurações
const CONFIG = {
  chavePix: 'notasedu.pix@gmail.com',
  whatsapp: '5551989929557',
  whatsappFormatado: '(51) 98992-9557'
};

// Dados dos planos
const PLANOS = {
  basico: {
    id: 'basico',
    nome: 'Básico',
    icon: Zap,
    cor: 'slate',
    gradient: 'from-slate-500 to-slate-600',
    shadow: 'shadow-slate-500/20',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    precos: {
      mensal: 4.90,
      semestral: 19.90,
      anual: 34.90
    },
    funcionalidades: [
      { nome: 'Até 20 disciplinas', disponivel: true },
      { nome: 'Dashboard básico', disponivel: true },
      { nome: 'Sincronização em nuvem', disponivel: true },
      { nome: 'Suporte por email (72h)', disponivel: true },
      { nome: 'Exportar PDF', disponivel: false },
      { nome: 'Previsão de formatura', disponivel: false },
      { nome: 'Simulador de notas', disponivel: false },
      { nome: 'Múltiplos cursos', disponivel: false },
      { nome: 'Metas e alertas', disponivel: false },
      { nome: 'Backup/Exportar dados', disponivel: false },
    ]
  },
  pro: {
    id: 'pro',
    nome: 'Pro',
    icon: Star,
    destaque: true,
    badge: 'MAIS POPULAR',
    cor: 'violet',
    gradient: 'from-violet-500 to-indigo-600',
    shadow: 'shadow-violet-500/30',
    border: 'border-violet-500/50',
    bg: 'bg-violet-500/10',
    precos: {
      mensal: 9.90,
      semestral: 39.90,
      anual: 69.90
    },
    funcionalidades: [
      { nome: 'Disciplinas ilimitadas', disponivel: true },
      { nome: 'Dashboard completo', disponivel: true },
      { nome: 'Sincronização em nuvem', disponivel: true },
      { nome: 'Suporte por email (48h)', disponivel: true },
      { nome: 'Exportar PDF', disponivel: true },
      { nome: 'Previsão de formatura', disponivel: true },
      { nome: 'Simulador de notas', disponivel: false },
      { nome: 'Múltiplos cursos', disponivel: false },
      { nome: 'Metas e alertas', disponivel: false },
      { nome: 'Backup/Exportar dados', disponivel: false },
    ]
  },
  premium: {
    id: 'premium',
    nome: 'Premium',
    icon: Crown,
    cor: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/30',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    precos: {
      mensal: 14.90,
      semestral: 59.90,
      anual: 99.90
    },
    funcionalidades: [
      { nome: 'Disciplinas ilimitadas', disponivel: true },
      { nome: 'Dashboard personalizável', disponivel: true },
      { nome: 'Sincronização em nuvem', disponivel: true },
      { nome: 'Suporte prioritário (24h)', disponivel: true },
      { nome: 'PDF completo com gráficos', disponivel: true },
      { nome: 'Previsão de formatura', disponivel: true },
      { nome: 'Simulador de notas', disponivel: true },
      { nome: 'Múltiplos cursos', disponivel: true },
      { nome: 'Metas e alertas', disponivel: true },
      { nome: 'Backup/Exportar dados', disponivel: true },
    ]
  }
};

// Calcular desconto
const calcularDesconto = (precoMensal, precoComDesconto, meses) => {
  const precoTotal = precoMensal * meses;
  const desconto = ((precoTotal - precoComDesconto) / precoTotal) * 100;
  return Math.round(desconto);
};

export default function Planos({ onVoltar }) {
  const [periodo, setPeriodo] = useState('semestral');
  const [planoSelecionado, setPlanoSelecionado] = useState(null);
  const [etapa, setEtapa] = useState('selecao'); // selecao, pagamento, formulario
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [pedidoData, setPedidoData] = useState({
    nome: '',
    email: '',
    comprovante: null
  });

  const mesesPorPeriodo = {
    mensal: 1,
    semestral: 6,
    anual: 12
  };

  const copiarChavePix = () => {
    navigator.clipboard.writeText(CONFIG.chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleSelecionarPlano = (plano) => {
    setPlanoSelecionado(plano);
    setEtapa('pagamento');
  };

  const handleEnviarPedido = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const plano = PLANOS[planoSelecionado];
      const preco = plano.precos[periodo];

      const { error } = await supabase.from('pedidos').insert([{
        nome: pedidoData.nome,
        email: pedidoData.email.toLowerCase(),
        status: 'PENDENTE',
        plano: planoSelecionado,
        periodo: periodo,
        valor: preco
      }]);

      if (error) throw error;

      setSuccess('Pedido enviado! Você receberá um email quando for aprovado.');
      setPedidoData({ nome: '', email: '', comprovante: null });
      
      setTimeout(() => {
        setEtapa('selecao');
        setPlanoSelecionado(null);
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Erro ao enviar pedido. Tente novamente.');
    }
    setLoading(false);
  };

  // Background
  const Background = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
    </div>
  );

  // Tela de Pagamento
  if (etapa === 'pagamento' && planoSelecionado) {
    const plano = PLANOS[planoSelecionado];
    const preco = plano.precos[periodo];
    const Icon = plano.icon;

    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4">
        <Background />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8">
            <button
              onClick={() => setEtapa('selecao')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar aos planos</span>
            </button>

            {/* Plano selecionado */}
            <div className={`${plano.bg} border ${plano.border} rounded-2xl p-4 mb-6`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plano.gradient} flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Plano {plano.nome}</h3>
                  <p className="text-slate-400 text-sm capitalize">{periodo}</p>
                </div>
                <div className="ml-auto text-right">
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
                  <code className="flex-1 text-white bg-black/30 px-3 py-2 rounded-lg text-sm font-mono">
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

            {/* Formulário */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-400">Seus dados</h4>
              
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle size={16} />
                  {success}
                </div>
              )}

              <form onSubmit={handleEnviarPedido} className="space-y-4">
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={pedidoData.nome}
                    onChange={(e) => setPedidoData({ ...pedidoData, nome: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={pedidoData.email}
                    onChange={(e) => setPedidoData({ ...pedidoData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setPedidoData({ ...pedidoData, comprovante: e.target.files[0] })}
                    className="hidden"
                    id="comprovante"
                  />
                  <label
                    htmlFor="comprovante"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 border border-white/10 border-dashed text-slate-400 hover:text-white hover:border-violet-500/50 cursor-pointer transition-all"
                  >
                    {pedidoData.comprovante ? (
                      <>
                        <CheckCircle size={18} className="text-emerald-400" />
                        <span className="text-emerald-400 text-sm">{pedidoData.comprovante.name}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span className="text-sm">Anexar comprovante (opcional)</span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl bg-gradient-to-r ${plano.gradient} font-semibold ${plano.shadow} shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
                >
                  {loading ? 'Enviando...' : 'Confirmar Pedido'}
                </button>
              </form>
            </div>

            {/* WhatsApp */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-slate-500 text-xs mb-2">Ou envie o comprovante pelo WhatsApp</p>
              <a
                href={`https://wa.me/${CONFIG.whatsapp}?text=Olá! Quero assinar o plano ${plano.nome} (${periodo}) por R$${preco.toFixed(2)}. Meu email: ${pedidoData.email || '[seu email]'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {CONFIG.whatsappFormatado}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de Seleção de Planos
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <Background />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {onVoltar && (
            <button
              onClick={onVoltar}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 mx-auto"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Voltar ao login</span>
            </button>
          )}
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-medium mb-6">
            <Sparkles size={16} />
            Escolha o plano ideal para você
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Invista no seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">futuro acadêmico</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Organize suas notas, acompanhe seu progresso e conquiste sua formatura com mais tranquilidade.
          </p>
        </div>

        {/* Seletor de Período */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10">
            {[
              { id: 'mensal', label: 'Mensal' },
              { id: 'semestral', label: 'Semestral', badge: '33% OFF' },
              { id: 'anual', label: 'Anual', badge: '41% OFF' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodo(p.id)}
                className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  periodo === p.id
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
                {p.badge && (
                  <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    periodo === p.id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {p.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Object.values(PLANOS).map((plano) => {
            const Icon = plano.icon;
            const preco = plano.precos[periodo];
            const precoMensal = plano.precos.mensal;
            const meses = mesesPorPeriodo[periodo];
            const precoOriginal = precoMensal * meses;
            const temDesconto = periodo !== 'mensal';
            const desconto = temDesconto ? calcularDesconto(precoMensal, preco, meses) : 0;

            return (
              <div
                key={plano.id}
                className={`relative rounded-3xl transition-all duration-300 ${
                  plano.destaque
                    ? `bg-gradient-to-b from-violet-500/20 to-transparent border-2 ${plano.border} scale-105 shadow-2xl ${plano.shadow}`
                    : 'bg-white/[0.03] border border-white/10 hover:border-white/20'
                }`}
              >
                {/* Badge Mais Popular */}
                {plano.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1.5 rounded-full bg-gradient-to-r ${plano.gradient} text-white text-xs font-bold shadow-lg ${plano.shadow}`}>
                      ⭐ {plano.badge}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Header do Plano */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plano.gradient} flex items-center justify-center shadow-lg ${plano.shadow}`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plano.nome}</h3>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="mb-6">
                    {temDesconto && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 line-through text-sm">
                          R$ {precoOriginal.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                          -{desconto}%
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        R$ {preco.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-slate-400 text-sm">
                        /{periodo === 'mensal' ? 'mês' : periodo === 'semestral' ? 'semestre' : 'ano'}
                      </span>
                    </div>
                    {periodo !== 'mensal' && (
                      <p className="text-slate-500 text-xs mt-1">
                        Equivale a R$ {(preco / meses).toFixed(2).replace('.', ',')}/mês
                      </p>
                    )}
                  </div>

                  {/* Funcionalidades */}
                  <ul className="space-y-3 mb-8">
                    {plano.funcionalidades.map((func, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        {func.disponivel ? (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plano.gradient} flex items-center justify-center`}>
                            <Check size={12} className="text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                            <X size={12} className="text-slate-600" />
                          </div>
                        )}
                        <span className={func.disponivel ? 'text-slate-300' : 'text-slate-600'}>
                          {func.nome}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Botão */}
                  <button
                    onClick={() => handleSelecionarPlano(plano.id)}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      plano.destaque
                        ? `bg-gradient-to-r ${plano.gradient} text-white shadow-lg ${plano.shadow}`
                        : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    Assinar {plano.nome}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garantia */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="text-white font-medium">Satisfação garantida</p>
              <p className="text-slate-400 text-sm">7 dias para testar ou seu dinheiro de volta</p>
            </div>
          </div>
        </div>

        {/* FAQ Rápido */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas frequentes</h2>
          <div className="space-y-4">
            {[
              {
                pergunta: 'Posso trocar de plano depois?',
                resposta: 'Sim! Você pode fazer upgrade a qualquer momento. O valor pago será proporcional.'
              },
              {
                pergunta: 'Como funciona o pagamento?',
                resposta: 'Aceitamos Pix. Após o pagamento, envie o comprovante e seu acesso será liberado em até 24h.'
              },
              {
                pergunta: 'Posso cancelar quando quiser?',
                resposta: 'Sim, você pode cancelar a renovação a qualquer momento. Seu acesso continua até o fim do período pago.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-medium text-white mb-1">{faq.pergunta}</h4>
                <p className="text-slate-400 text-sm">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
