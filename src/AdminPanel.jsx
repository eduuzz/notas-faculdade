import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw, Check, X, Eye, Search, UserPlus, Trash2, Users, FileText, AlertTriangle, Loader2, Mail, Calendar, Edit3, Save, UserX, Crown, Star, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

const ADMIN_EMAIL = 'eproencad@gmail.com';

export default function AdminPanel({ onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroUsuarios, setFiltroUsuarios] = useState('TODOS');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  
  // Modal states
  const [modalExclusao, setModalExclusao] = useState(null);
  const [modalEditar, setModalEditar] = useState(null);
  const [editNome, setEditNome] = useState('');
  
  // Modal de plano
  const [modalPlano, setModalPlano] = useState(null);
  const [editPlano, setEditPlano] = useState('pro');
  const [editExpiracao, setEditExpiracao] = useState('');

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (isAdmin) carregarDados();
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });
      if (pedidosData) setPedidos(pedidosData);

      const { data: usuariosData } = await supabase
        .from('usuarios_autorizados')
        .select('*')
        .order('created_at', { ascending: false });
      if (usuariosData) setUsuarios(usuariosData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const aprovarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    setErro('');
    setSucesso('');
    try {
      const jaAutorizado = usuarios.find(u => u.email === pedido.email.toLowerCase());
      
      // Calcular data de expiração baseada no período
      let dataExpiracao = null;
      if (pedido.periodo) {
        const agora = new Date();
        if (pedido.periodo === 'mensal') {
          agora.setMonth(agora.getMonth() + 1);
        } else if (pedido.periodo === 'semestral') {
          agora.setMonth(agora.getMonth() + 6);
        } else if (pedido.periodo === 'anual') {
          agora.setFullYear(agora.getFullYear() + 1);
        }
        dataExpiracao = agora.toISOString();
      }
      
      if (!jaAutorizado) {
        const { error: insertError } = await supabase
          .from('usuarios_autorizados')
          .insert([{ 
            email: pedido.email.toLowerCase(), 
            ativo: true, 
            nome: pedido.nome,
            plano: pedido.plano || 'pro',
            plano_expira_em: dataExpiracao
          }]);
        if (insertError) {
          setErro('Erro ao autorizar: ' + insertError.message);
          setActionLoading(null);
          return;
        }
      } else {
        // Atualizar plano do usuário existente
        await supabase
          .from('usuarios_autorizados')
          .update({ 
            plano: pedido.plano || 'pro',
            plano_expira_em: dataExpiracao
          })
          .eq('email', pedido.email.toLowerCase());
      }
      
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ status: 'APROVADO', updated_at: new Date().toISOString() })
        .eq('id', pedido.id);
      if (updateError) setErro('Erro ao aprovar');
      else {
        setSucesso(`Pedido de ${pedido.nome} aprovado! Plano: ${(pedido.plano || 'pro').toUpperCase()}`);
        carregarDados();
      }
    } catch (err) {
      setErro('Erro inesperado');
    }
    setActionLoading(null);
  };

  const rejeitarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    try {
      await supabase
        .from('pedidos')
        .update({ status: 'REJEITADO', updated_at: new Date().toISOString() })
        .eq('id', pedido.id);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const adicionarUsuario = async (e) => {
    e.preventDefault();
    if (!novoEmail.trim()) return;
    setActionLoading('novo');
    setErro('');
    setSucesso('');
    try {
      const { error } = await supabase
        .from('usuarios_autorizados')
        .insert([{ 
          email: novoEmail.trim().toLowerCase(), 
          ativo: true,
          nome: novoNome.trim() || null
        }]);
      if (error) setErro(error.code === '23505' ? 'Email já cadastrado' : error.message);
      else {
        setSucesso('Usuário adicionado!');
        setNovoEmail('');
        setNovoNome('');
        carregarDados();
      }
    } catch (err) {
      setErro('Erro inesperado');
    }
    setActionLoading(null);
  };

  // Editar nome do usuário
  const salvarNome = async () => {
    if (!modalEditar) return;
    setActionLoading(modalEditar.id);
    setErro('');
    
    try {
      const { error } = await supabase
        .from('usuarios_autorizados')
        .update({ nome: editNome.trim() || null })
        .eq('id', modalEditar.id);

      if (error) {
        setErro('Erro ao salvar: ' + error.message);
      } else {
        setSucesso(`Nome atualizado para ${modalEditar.email}!`);
        setModalEditar(null);
        carregarDados();
      }
    } catch (err) {
      setErro('Erro inesperado');
    }
    setActionLoading(null);
  };

  // Excluir usuário (usando função do Supabase)
  const excluirUsuario = async (usuario) => {
    setActionLoading(usuario.id);
    setErro('');
    setSucesso('');

    try {
      const email = usuario.email.toLowerCase();

      // Chama a função do Supabase que exclui tudo
      const { data, error } = await supabase.rpc('excluir_usuario_completo', {
        email_usuario: email
      });

      if (error) {
        // Se a função não existir, faz exclusão parcial
        if (error.message.includes('function') || error.code === '42883') {
          // Fallback: exclusão manual
          await supabase.from('usuarios_autorizados').delete().eq('id', usuario.id);
          await supabase.from('pedidos').update({ status: 'USUARIO_EXCLUIDO' }).eq('email', email);
          
          setSucesso(`Usuário ${email} removido do sistema!`);
        } else {
          setErro('Erro ao excluir: ' + error.message);
          setActionLoading(null);
          return;
        }
      } else {
        setSucesso(`✅ Usuário ${email} excluído completamente!`);
      }

      setModalExclusao(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setErro('Erro inesperado ao excluir usuário');
    }
    setActionLoading(null);
  };

  // Salvar plano do usuário
  const salvarPlano = async () => {
    if (!modalPlano) return;
    setActionLoading(modalPlano.id);
    setErro('');
    setSucesso('');
    
    try {
      const updateData = { 
        plano: editPlano,
        plano_expira_em: editExpiracao ? new Date(editExpiracao).toISOString() : null
      };

      console.log('Salvando plano:', { id: modalPlano.id, ...updateData });

      const { data, error } = await supabase
        .from('usuarios_autorizados')
        .update(updateData)
        .eq('id', modalPlano.id)
        .select();

      console.log('Resposta:', { data, error });

      if (error) {
        console.error('Erro Supabase:', error);
        setErro('Erro ao salvar plano: ' + error.message);
      } else if (!data || data.length === 0) {
        setErro('Nenhum registro atualizado. Verifique se as colunas existem no banco.');
      } else {
        // Atualiza o usuário localmente para refletir a mudança imediatamente
        setUsuarios(prev => prev.map(u => 
          u.id === modalPlano.id 
            ? { ...u, plano: editPlano, plano_expira_em: editExpiracao ? new Date(editExpiracao).toISOString() : null }
            : u
        ));
        setSucesso(`Plano de ${modalPlano.email} atualizado para ${editPlano.toUpperCase()}!`);
        setModalPlano(null);
        
        // Recarrega do banco também para garantir sincronia
        setTimeout(() => carregarDados(), 500);
      }
    } catch (err) {
      console.error('Erro catch:', err);
      setErro('Erro inesperado: ' + err.message);
    }
    setActionLoading(null);
  };

  // Abrir modal de plano
  const abrirModalPlano = (usuario) => {
    setModalPlano(usuario);
    setEditPlano(usuario.plano || 'pro');
    setEditExpiracao(usuario.plano_expira_em ? usuario.plano_expira_em.split('T')[0] : '');
  };

  // Filtros de pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const matchBusca = p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.email?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Filtros de usuários
  const usuariosFiltrados = usuarios.filter(u => {
    return u.email?.toLowerCase().includes(busca.toLowerCase()) ||
      (u.nome && u.nome.toLowerCase().includes(busca.toLowerCase()));
  });

  // Contadores
  const pedidosPendentes = pedidos.filter(p => p.status === 'PENDENTE').length;
  const pedidosExcluidos = pedidos.filter(p => p.status === 'USUARIO_EXCLUIDO').length;

  // Função para obter cor do status
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-500/20 text-yellow-300';
      case 'APROVADO': return 'bg-green-500/20 text-green-300';
      case 'REJEITADO': return 'bg-red-500/20 text-red-300';
      case 'USUARIO_EXCLUIDO': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-slate-500/20 text-slate-300';
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'APROVADO': return 'Aprovado';
      case 'REJEITADO': return 'Rejeitado';
      case 'USUARIO_EXCLUIDO': return 'Usuário Excluído';
      default: return status;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-red-400 mb-4" size={48} />
          <h1 className="text-xl text-white mb-2">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta área.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="text-slate-400" size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="text-indigo-400" size={24} />
              <h1 className="text-xl font-bold text-white">Painel Admin</h1>
            </div>
          </div>
          <button
            onClick={carregarDados}
            disabled={loading}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} size={20} />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle size={18} />
            {erro}
            <button onClick={() => setErro('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {sucesso && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-300 text-sm flex items-center gap-2">
            <Check size={18} />
            {sucesso}
            <button onClick={() => setSucesso('')} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAbaAtiva('pedidos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'pedidos'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <FileText size={18} />
            Pedidos ({pedidosPendentes})
          </button>
          <button
            onClick={() => setAbaAtiva('usuarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'usuarios'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <Users size={18} />
            Usuários ({usuarios.length})
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              abaAtiva === 'historico'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <UserX size={18} />
            Excluídos ({pedidosExcluidos})
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          
          {abaAtiva === 'pedidos' && (
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="TODOS">Todos ({pedidos.length})</option>
              <option value="PENDENTE">Pendentes ({pedidosPendentes})</option>
              <option value="APROVADO">Aprovados ({pedidos.filter(p => p.status === 'APROVADO').length})</option>
              <option value="REJEITADO">Rejeitados ({pedidos.filter(p => p.status === 'REJEITADO').length})</option>
              <option value="USUARIO_EXCLUIDO">Excluídos ({pedidosExcluidos})</option>
            </select>
          )}

        </div>

        {/* Conteúdo: Pedidos */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="mx-auto mb-2 opacity-50" size={32} />
                Nenhum pedido encontrado
              </div>
            ) : (
              pedidosFiltrados.map(pedido => (
                <div
                  key={pedido.id}
                  className={`bg-slate-800/50 border rounded-xl p-4 transition-colors ${
                    pedido.status === 'USUARIO_EXCLUIDO' 
                      ? 'border-purple-500/30 bg-purple-500/5' 
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white">{pedido.nome}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                        {/* Badge do Plano solicitado */}
                        {pedido.plano && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                            pedido.plano === 'premium' ? 'bg-amber-500/20 text-amber-300' :
                            pedido.plano === 'basico' ? 'bg-slate-500/20 text-slate-300' :
                            'bg-violet-500/20 text-violet-300'
                          }`}>
                            {pedido.plano === 'premium' ? <Crown size={10} /> :
                             pedido.plano === 'basico' ? <Zap size={10} /> :
                             <Star size={10} />}
                            {pedido.plano.toUpperCase()}
                          </span>
                        )}
                        {/* Período */}
                        {pedido.periodo && (
                          <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-xs">
                            {pedido.periodo}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm flex items-center gap-1">
                        <Mail size={14} />
                        {pedido.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(pedido.created_at).toLocaleString('pt-BR')}
                        </p>
                        {/* Valor do pedido */}
                        {pedido.valor && (
                          <p className="text-emerald-400 text-xs font-medium">
                            R$ {pedido.valor.toFixed(2)}
                          </p>
                        )}
                      </div>
                      {pedido.status === 'USUARIO_EXCLUIDO' && (
                        <p className="text-purple-400 text-xs mt-2 flex items-center gap-1">
                          <UserX size={12} />
                          Este usuário foi excluído do sistema
                        </p>
                      )}
                      {pedido.tipo === 'UPGRADE' && (
                        <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                          ⬆️ Upgrade de plano
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pedido.comprovante_url && (
                        <a
                          href={pedido.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 text-sm"
                        >
                          <Eye size={16} />
                          Ver
                        </a>
                      )}
                      {pedido.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => aprovarPedido(pedido)}
                            disabled={actionLoading === pedido.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white text-sm disabled:opacity-50"
                          >
                            {actionLoading === pedido.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Check size={16} />
                            )}
                            Aprovar
                          </button>
                          <button
                            onClick={() => rejeitarPedido(pedido)}
                            disabled={actionLoading === pedido.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg transition-colors text-white text-sm disabled:opacity-50"
                          >
                            <X size={16} />
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Conteúdo: Usuários */}
        {abaAtiva === 'usuarios' && (
          <div className="space-y-4">
            {/* Adicionar novo usuário */}
            <form onSubmit={adicionarUsuario} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-3 font-medium">Adicionar usuário manualmente</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="relative flex-1">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Nome (opcional)"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === 'novo' || !novoEmail.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'novo' ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  Adicionar
                </button>
              </div>
            </form>

            {/* Lista de usuários */}
            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Users className="mx-auto mb-2 opacity-50" size={32} />
                Nenhum usuário encontrado
              </div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div
                  key={usuario.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-white">{usuario.email}</span>
                        {/* Badge do Plano */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                          usuario.plano === 'admin' ? 'bg-red-500/20 text-red-300' :
                          usuario.plano === 'premium' ? 'bg-amber-500/20 text-amber-300' :
                          usuario.plano === 'basico' ? 'bg-slate-500/20 text-slate-300' :
                          'bg-violet-500/20 text-violet-300'
                        }`}>
                          {usuario.plano === 'admin' ? <Shield size={10} /> :
                           usuario.plano === 'premium' ? <Crown size={10} /> :
                           usuario.plano === 'basico' ? <Zap size={10} /> :
                           <Star size={10} />}
                          {(usuario.plano || 'pro').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {usuario.nome ? (
                          <p className="text-slate-400 text-sm">{usuario.nome}</p>
                        ) : (
                          <p className="text-slate-500 text-sm italic">Sem nome</p>
                        )}
                        <button
                          onClick={() => {
                            setModalEditar(usuario);
                            setEditNome(usuario.nome || '');
                          }}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          title="Editar nome"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          Desde: {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        {usuario.plano_expira_em && (
                          <p className={`text-xs flex items-center gap-1 ${
                            new Date(usuario.plano_expira_em) < new Date() ? 'text-red-400' : 'text-slate-500'
                          }`}>
                            {new Date(usuario.plano_expira_em) < new Date() ? '⚠️ Expirado:' : 'Expira:'}
                            {new Date(usuario.plano_expira_em).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Botão Plano */}
                      <button
                        onClick={() => abrirModalPlano(usuario)}
                        disabled={actionLoading === usuario.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                      >
                        <Crown size={16} />
                        Plano
                      </button>
                      {/* Botão Excluir */}
                      <button
                        onClick={() => setModalExclusao(usuario)}
                        disabled={actionLoading === usuario.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* ABA: Histórico de Excluídos */}
        {/* ============================================ */}
        {abaAtiva === 'historico' && (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <UserX className="text-purple-400" size={24} />
                <div>
                  <h3 className="text-purple-300 font-medium">Histórico de Exclusões</h3>
                  <p className="text-purple-200/70 text-sm">Usuários que foram removidos do sistema</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : pedidos.filter(p => p.status === 'USUARIO_EXCLUIDO' && (
              p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
              p.email?.toLowerCase().includes(busca.toLowerCase())
            )).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <UserX className="mx-auto mb-2 opacity-50" size={32} />
                Nenhum usuário excluído
              </div>
            ) : (
              pedidos
                .filter(p => p.status === 'USUARIO_EXCLUIDO' && (
                  p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                  p.email?.toLowerCase().includes(busca.toLowerCase())
                ))
                .map(pedido => (
                  <div
                    key={pedido.id}
                    className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-white">{pedido.nome || 'Sem nome'}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300">
                            Excluído
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">{pedido.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Cadastro: {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {pedido.updated_at && (
                            <span className="flex items-center gap-1">
                              <Trash2 size={12} />
                              Excluído: {new Date(pedido.updated_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL: Gerenciar Plano */}
      {/* ============================================ */}
      {modalPlano && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalPlano(null)}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center">
                <Crown className="text-violet-400" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gerenciar Plano</h2>
                <p className="text-slate-400 text-sm">{modalPlano.email}</p>
              </div>
            </div>

            {/* Seletor de Plano */}
            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">Plano</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'basico', label: 'Básico', icon: Zap, cor: 'slate' },
                  { id: 'pro', label: 'Pro', icon: Star, cor: 'violet' },
                  { id: 'premium', label: 'Premium', icon: Crown, cor: 'amber' },
                  { id: 'admin', label: 'Admin', icon: Shield, cor: 'red' },
                ].map(plano => (
                  <button
                    key={plano.id}
                    onClick={() => setEditPlano(plano.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      editPlano === plano.id 
                        ? plano.cor === 'slate' ? 'border-slate-400 bg-slate-500/20' :
                          plano.cor === 'violet' ? 'border-violet-400 bg-violet-500/20' :
                          plano.cor === 'amber' ? 'border-amber-400 bg-amber-500/20' :
                          'border-red-400 bg-red-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <plano.icon size={18} className={
                      plano.cor === 'slate' ? 'text-slate-400' :
                      plano.cor === 'violet' ? 'text-violet-400' :
                      plano.cor === 'amber' ? 'text-amber-400' :
                      'text-red-400'
                    } />
                    <span className="text-white font-medium">{plano.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data de Expiração */}
            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-2">
                Data de Expiração 
                <span className="text-slate-500 ml-1">(opcional)</span>
              </label>
              <input
                type="date"
                value={editExpiracao}
                onChange={(e) => setEditExpiracao(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
              {editPlano === 'admin' && (
                <p className="text-amber-400 text-xs mt-2">
                  ⚠️ Admin não precisa de data de expiração
                </p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 1);
                    setEditExpiracao(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  +1 mês
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 6);
                    setEditExpiracao(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  +6 meses
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + 1);
                    setEditExpiracao(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  +1 ano
                </button>
                <button
                  onClick={() => setEditExpiracao('')}
                  className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalPlano(null)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPlano}
                disabled={actionLoading === modalPlano.id}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalPlano.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Editar Nome */}
      {/* ============================================ */}
      {modalEditar && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalEditar(null)}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                <Edit3 className="text-indigo-400" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Editar Usuário</h2>
                <p className="text-slate-400 text-sm">{modalEditar.email}</p>
              </div>
            </div>

            {/* Campo de nome */}
            <div className="mb-6">
              <label className="block text-slate-400 text-sm mb-2">Nome do usuário</label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Digite o nome..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNome}
                disabled={actionLoading === modalEditar.id}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalEditar.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Confirmar Exclusão */}
      {/* ============================================ */}
      {modalExclusao && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalExclusao(null)}
        >
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
                <Trash2 className="text-red-400" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Excluir Usuário</h2>
                <p className="text-slate-400 text-sm">Exclusão completa e permanente</p>
              </div>
            </div>

            {/* Info do usuário */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold text-red-400">
                    {modalExclusao.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{modalExclusao.email}</p>
                  {modalExclusao.nome && (
                    <p className="text-slate-400 text-sm">{modalExclusao.nome}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    Cadastrado em {new Date(modalExclusao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            {/* O que será excluído */}
            <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
              <p className="text-slate-400 text-sm mb-3 font-medium">Será removido automaticamente:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-400" size={16} />
                  <span className="text-slate-300">Conta de login (Authentication)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-400" size={16} />
                  <span className="text-slate-300">Autorização de acesso</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-400" size={16} />
                  <span className="text-slate-300">Todas as disciplinas e notas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-400" size={16} />
                  <span className="text-slate-300">Pedidos marcados como excluídos</span>
                </div>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-300 text-sm font-medium">Ação irreversível</p>
                  <p className="text-red-200/70 text-xs mt-1">
                    Todos os dados serão permanentemente excluídos e não poderão ser recuperados.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={() => setModalExclusao(null)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluirUsuario(modalExclusao)}
                disabled={actionLoading === modalExclusao.id}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalExclusao.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Trash2 size={20} />
                    Excluir Tudo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
