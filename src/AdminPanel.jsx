import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw, Check, X, Eye, Search, UserPlus, Trash2, Users, FileText, AlertTriangle, Loader2, Mail, Calendar, Edit3, Save, UserX } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

import { ADMIN_EMAIL } from './supabaseClient';

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

      if (!jaAutorizado) {
        const { error: insertError } = await supabase
          .from('usuarios_autorizados')
          .insert([{
            email: pedido.email.toLowerCase(),
            ativo: true,
            nome: pedido.nome,
          }]);
        if (insertError) {
          setErro('Erro ao autorizar: ' + insertError.message);
          setActionLoading(null);
          return;
        }
      }

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ status: 'APROVADO', updated_at: new Date().toISOString() })
        .eq('id', pedido.id);
      if (updateError) setErro('Erro ao aprovar');
      else {
        setSucesso(`Pedido de ${pedido.nome} aprovado!`);
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

  const excluirUsuario = async (usuario) => {
    setActionLoading(usuario.id);
    setErro('');
    setSucesso('');

    try {
      const email = usuario.email.toLowerCase();

      const { data, error } = await supabase.rpc('excluir_usuario_completo', {
        email_usuario: email
      });

      if (error) {
        if (error.message.includes('function') || error.code === '42883') {
          await supabase.from('usuarios_autorizados').delete().eq('id', usuario.id);
          await supabase.from('pedidos').update({ status: 'USUARIO_EXCLUIDO' }).eq('email', email);

          setSucesso(`Usuário ${email} removido do sistema!`);
        } else {
          setErro('Erro ao excluir: ' + error.message);
          setActionLoading(null);
          return;
        }
      } else {
        setSucesso(`Usuário ${email} excluído completamente!`);
      }

      setModalExclusao(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setErro('Erro inesperado ao excluir usuário');
    }
    setActionLoading(null);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-500/20 text-yellow-400 dark:text-yellow-300';
      case 'APROVADO': return 'bg-green-500/20 text-green-600 dark:text-green-300';
      case 'REJEITADO': return 'bg-red-500/20 text-red-600 dark:text-red-300';
      case 'USUARIO_EXCLUIDO': return 'bg-purple-500/20 text-purple-600 dark:text-purple-300';
      default: return 'bg-[var(--bg-input)] text-[var(--text-muted)]';
    }
  };

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
      <div className="min-h-screen bg-[var(--bg-root)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-red-400 mb-4" size={48} />
          <h1 className="text-xl text-[var(--text-primary)] mb-2">Acesso Negado</h1>
          <p className="text-[var(--text-muted)]">Você não tem permissão para acessar esta área.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-input)]"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)]">
      {/* Header */}
      <div className="bg-[var(--bg-card)] border-b border-[var(--border-card)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
            >
              <ArrowLeft className="text-[var(--text-secondary)]" size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield size={24} style={{ color: 'var(--accent-400)' }} />
              <h1 className="text-xl font-bold text-[var(--text-primary)]">Painel Admin</h1>
            </div>
          </div>
          <button
            onClick={carregarDados}
            disabled={loading}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            <RefreshCw className={`text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} size={20} />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-600 dark:text-red-300 text-sm flex items-center gap-2">
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
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-600 dark:text-green-300 text-sm flex items-center gap-2">
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              abaAtiva === 'pedidos'
                ? 'bg-[var(--accent-bg10)] text-[var(--accent-400)] border border-[var(--accent-ring)]'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <FileText size={18} />
            Pedidos ({pedidosPendentes})
          </button>
          <button
            onClick={() => setAbaAtiva('usuarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              abaAtiva === 'usuarios'
                ? 'bg-[var(--accent-bg10)] text-[var(--accent-400)] border border-[var(--accent-ring)]'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <Users size={18} />
            Usuários ({usuarios.length})
          </button>
          <button
            onClick={() => setAbaAtiva('historico')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              abaAtiva === 'historico'
                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-transparent'
            }`}
          >
            <UserX size={18} />
            Excluídos ({pedidosExcluidos})
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
              onBlur={(e) => e.target.style.borderColor = ''}
            />
          </div>

          {abaAtiva === 'pedidos' && (
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] focus:outline-none transition-all"
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
              onBlur={(e) => e.target.style.borderColor = ''}
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
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <FileText className="mx-auto mb-2 opacity-50" size={32} />
                Nenhum pedido encontrado
              </div>
            ) : (
              pedidosFiltrados.map(pedido => (
                <div
                  key={pedido.id}
                  className={`bg-[var(--bg-card)] border rounded-xl p-4 transition-colors ${
                    pedido.status === 'USUARIO_EXCLUIDO'
                      ? 'border-purple-500/30'
                      : 'border-[var(--border-card)] hover:border-[var(--border-input)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-[var(--text-primary)]">{pedido.nome}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(pedido.status)}`}>
                          {getStatusLabel(pedido.status)}
                        </span>
                      </div>
                      <p className="text-[var(--text-secondary)] text-sm flex items-center gap-1">
                        <Mail size={14} />
                        {pedido.email}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(pedido.created_at).toLocaleString('pt-BR')}
                        </p>
                        {pedido.valor && (
                          <p className="text-emerald-500 dark:text-emerald-400 text-xs font-medium">
                            R$ {pedido.valor.toFixed(2)}
                          </p>
                        )}
                      </div>
                      {pedido.status === 'USUARIO_EXCLUIDO' && (
                        <p className="text-purple-600 dark:text-purple-400 text-xs mt-2 flex items-center gap-1">
                          <UserX size={12} />
                          Este usuário foi excluído do sistema
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pedido.comprovante_url && (
                        <a
                          href={pedido.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] text-sm border border-[var(--border-input)]"
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
            <form onSubmit={adicionarUsuario} className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4">
              <p className="text-[var(--text-secondary)] text-sm mb-3 font-medium">Adicionar usuário manualmente</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={novoEmail}
                    onChange={(e) => setNovoEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                    required
                  />
                </div>
                <div className="relative flex-1">
                  <Edit3 className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                  <input
                    type="text"
                    placeholder="Nome (opcional)"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
                    onFocus={(e) => e.target.style.borderColor = 'var(--accent-500)'}
                    onBlur={(e) => e.target.style.borderColor = ''}
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading === 'novo' || !novoEmail.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ background: 'linear-gradient(to right, var(--accent-600), var(--accent-500))' }}
                >
                  {actionLoading === 'novo' ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                  Adicionar
                </button>
              </div>
            </form>

            {/* Lista de usuários */}
            {loading ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Users className="mx-auto mb-2 opacity-50" size={32} />
                Nenhum usuário encontrado
              </div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div
                  key={usuario.id}
                  className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-xl p-4 hover:border-[var(--border-input)] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-[var(--text-primary)]">{usuario.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {usuario.nome ? (
                          <p className="text-[var(--text-secondary)] text-sm">{usuario.nome}</p>
                        ) : (
                          <p className="text-[var(--text-muted)] text-sm italic">Sem nome</p>
                        )}
                        <button
                          onClick={() => {
                            setModalEditar(usuario);
                            setEditNome(usuario.nome || '');
                          }}
                          className="transition-colors"
                          style={{ color: 'var(--accent-400)' }}
                          title="Editar nome"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                          <Calendar size={12} />
                          Desde: {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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

        {/* ABA: Histórico de Excluídos */}
        {abaAtiva === 'historico' && (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <UserX className="text-purple-600 dark:text-purple-400" size={24} />
                <div>
                  <h3 className="text-purple-700 dark:text-purple-300 font-medium">Histórico de Exclusões</h3>
                  <p className="text-purple-600/70 dark:text-purple-200/70 text-sm">Usuários que foram removidos do sistema</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                Carregando...
              </div>
            ) : pedidos.filter(p => p.status === 'USUARIO_EXCLUIDO' && (
              p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
              p.email?.toLowerCase().includes(busca.toLowerCase())
            )).length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
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
                    className="bg-[var(--bg-card)] border border-purple-500/30 rounded-xl p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-[var(--text-primary)]">{pedido.nome || 'Sem nome'}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-600 dark:text-purple-300">
                            Excluído
                          </span>
                        </div>
                        <p className="text-[var(--text-secondary)] text-sm">{pedido.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
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

      {/* MODAL: Editar Nome */}
      {modalEditar && (
        <div
          className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalEditar(null)}
        >
          <div className="bg-[var(--bg-modal)] border border-[var(--border-card)] rounded-lg p-5 max-w-md w-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-bg10)' }}>
                <Edit3 size={20} style={{ color: 'var(--accent-400)' }} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Editar Usuário</h2>
                <p className="text-[var(--text-muted)] text-xs">{modalEditar.email}</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Nome do usuário</label>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Digite o nome..."
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-md text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setModalEditar(null)}
                className="flex-1 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-md text-[var(--text-secondary)] text-sm font-medium transition-colors border border-[var(--border-input)]"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNome}
                disabled={actionLoading === modalEditar.id}
                className="flex-1 py-2 rounded-md bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalEditar.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Save size={16} />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmar Exclusão */}
      {modalExclusao && (
        <div
          className="fixed inset-0 bg-[var(--bg-modal-overlay)] flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setModalExclusao(null)}
        >
          <div className="bg-[var(--bg-modal)] border border-[var(--border-card)] rounded-lg p-5 max-w-md w-full">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                <Trash2 className="text-red-400" size={20} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Excluir Usuário</h2>
                <p className="text-[var(--text-muted)] text-xs">Exclusão completa e permanente</p>
              </div>
            </div>

            <div className="bg-[var(--bg-input)] rounded-md p-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-500/10 rounded-md flex items-center justify-center">
                  <span className="text-sm font-bold text-red-400">
                    {modalExclusao.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-medium">{modalExclusao.email}</p>
                  {modalExclusao.nome && (
                    <p className="text-[var(--text-secondary)] text-sm">{modalExclusao.nome}</p>
                  )}
                  <p className="text-[var(--text-muted)] text-xs mt-1">
                    Cadastrado em {new Date(modalExclusao.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-input)] rounded-md p-3 mb-4">
              <p className="text-[var(--text-secondary)] text-sm mb-3 font-medium">Será removido automaticamente:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-500 dark:text-green-400" size={16} />
                  <span className="text-[var(--text-secondary)]">Conta de login (Authentication)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-500 dark:text-green-400" size={16} />
                  <span className="text-[var(--text-secondary)]">Autorização de acesso</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-500 dark:text-green-400" size={16} />
                  <span className="text-[var(--text-secondary)]">Todas as disciplinas e notas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="text-green-500 dark:text-green-400" size={16} />
                  <span className="text-[var(--text-secondary)]">Pedidos marcados como excluídos</span>
                </div>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-md p-3 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-600 dark:text-red-300 text-sm font-medium">Ação irreversível</p>
                  <p className="text-red-500/70 dark:text-red-200/70 text-xs mt-1">
                    Todos os dados serão permanentemente excluídos e não poderão ser recuperados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setModalExclusao(null)}
                className="flex-1 py-2 bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] rounded-md text-[var(--text-secondary)] text-sm font-medium transition-colors border border-[var(--border-input)]"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluirUsuario(modalExclusao)}
                disabled={actionLoading === modalExclusao.id}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalExclusao.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Trash2 size={16} />
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
