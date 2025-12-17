import React, { useState, useEffect } from 'react';
import { Shield, ArrowLeft, RefreshCw, Check, X, Eye, Search, UserPlus, Trash2, Users, FileText, AlertTriangle, Loader2 } from 'lucide-react';
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
  const [novoEmail, setNovoEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [modalExclusao, setModalExclusao] = useState(null);
  const [exclusaoCompleta, setExclusaoCompleta] = useState(true);

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
          .insert([{ email: pedido.email.toLowerCase(), ativo: true, nome: pedido.nome }]);
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
        .insert([{ email: novoEmail.trim().toLowerCase(), ativo: true }]);
      if (error) setErro(error.code === '23505' ? 'Email já cadastrado' : error.message);
      else {
        setSucesso('Usuário adicionado!');
        setNovoEmail('');
        carregarDados();
      }
    } catch (err) {
      setErro('Erro inesperado');
    }
    setActionLoading(null);
  };

  // ========================================
  // FUNÇÃO DE EXCLUSÃO COMPLETA DE USUÁRIO
  // ========================================
  const excluirUsuario = async (usuario) => {
    setActionLoading(usuario.id);
    setErro('');
    setSucesso('');

    try {
      const email = usuario.email.toLowerCase();
      let etapas = [];

      // 1. Buscar user_id no Supabase Auth pela tabela notas_usuarios ou disciplinas
      // Como não temos acesso direto ao Auth Admin API pelo cliente,
      // vamos excluir apenas das tabelas de dados

      // Passo 1: Excluir disciplinas do usuário
      if (exclusaoCompleta) {
        // Buscar o user_id baseado no email (se existir na tabela notas_usuarios)
        const { data: notasData } = await supabase
          .from('notas_usuarios')
          .select('user_id')
          .limit(100);

        // Tentar encontrar registros relacionados
        // Como user_id pode estar em formato diferente, vamos buscar de outra forma
        
        // Deletar de notas_usuarios onde o email corresponde
        // Precisamos de uma forma de identificar o usuário

        // Abordagem: buscar em auth.users via RPC (se configurado)
        // Por enquanto, informamos que a exclusão do Auth deve ser manual

        etapas.push('⚠️ Dados da tabela disciplinas: excluir manualmente pelo user_id no Supabase');
        etapas.push('⚠️ Dados da tabela notas_usuarios: excluir manualmente pelo user_id no Supabase');
      }

      // Passo 2: Excluir da tabela usuarios_autorizados
      const { error: errorUsuarios } = await supabase
        .from('usuarios_autorizados')
        .delete()
        .eq('id', usuario.id);

      if (errorUsuarios) {
        setErro('Erro ao excluir da tabela usuarios_autorizados: ' + errorUsuarios.message);
        setActionLoading(null);
        return;
      }
      etapas.push('✅ Removido de usuarios_autorizados');

      // Passo 3: Atualizar pedidos relacionados (opcional - marcar como excluído)
      const { error: errorPedidos } = await supabase
        .from('pedidos')
        .update({ status: 'USUARIO_EXCLUIDO' })
        .eq('email', email);

      if (!errorPedidos) {
        etapas.push('✅ Pedidos marcados como USUARIO_EXCLUIDO');
      }

      setSucesso(
        `Usuário ${email} removido!\n\n` +
        etapas.join('\n') +
        '\n\n📌 IMPORTANTE: Para exclusão completa, vá no Supabase:\n' +
        '1. Authentication → Users → Encontre o email → Delete\n' +
        '2. Table Editor → disciplinas → Filtre por user_id → Delete\n' +
        '3. Table Editor → notas_usuarios → Filtre por user_id → Delete'
      );
      
      setModalExclusao(null);
      carregarDados();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      setErro('Erro inesperado ao excluir usuário');
    }
    setActionLoading(null);
  };

  // Função simplificada - apenas bloquear acesso
  const bloquearUsuario = async (usuario) => {
    setActionLoading(usuario.id);
    setErro('');
    setSucesso('');

    try {
      const { error } = await supabase
        .from('usuarios_autorizados')
        .update({ ativo: false })
        .eq('id', usuario.id);

      if (error) {
        setErro('Erro ao bloquear: ' + error.message);
      } else {
        setSucesso(`Usuário ${usuario.email} bloqueado! Ele não conseguirá mais fazer login.`);
        carregarDados();
      }
    } catch (err) {
      setErro('Erro inesperado');
    }
    setActionLoading(null);
  };

  // Desbloquear usuário
  const desbloquearUsuario = async (usuario) => {
    setActionLoading(usuario.id);
    try {
      await supabase
        .from('usuarios_autorizados')
        .update({ ativo: true })
        .eq('id', usuario.id);
      setSucesso(`Usuário ${usuario.email} desbloqueado!`);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter(p => {
    const matchBusca = p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      p.email?.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(u =>
    u.email?.toLowerCase().includes(busca.toLowerCase()) ||
    (u.nome && u.nome.toLowerCase().includes(busca.toLowerCase()))
  );

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
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm whitespace-pre-line">
            {erro}
          </div>
        </div>
      )}
      {sucesso && (
        <div className="max-w-6xl mx-auto px-4 mt-4">
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-300 text-sm whitespace-pre-line">
            {sucesso}
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
            Pedidos ({pedidos.filter(p => p.status === 'PENDENTE').length})
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
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendentes</option>
              <option value="APROVADO">Aprovados</option>
              <option value="REJEITADO">Rejeitados</option>
            </select>
          )}
        </div>

        {/* Conteúdo das Abas */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : pedidosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum pedido encontrado
              </div>
            ) : (
              pedidosFiltrados.map(pedido => (
                <div
                  key={pedido.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{pedido.nome}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          pedido.status === 'PENDENTE' ? 'bg-yellow-500/20 text-yellow-300' :
                          pedido.status === 'APROVADO' ? 'bg-green-500/20 text-green-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {pedido.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{pedido.email}</p>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(pedido.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pedido.comprovante_url && (
                        <a
                          href={pedido.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Ver comprovante"
                        >
                          <Eye className="text-slate-300" size={18} />
                        </a>
                      )}
                      {pedido.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => aprovarPedido(pedido)}
                            disabled={actionLoading === pedido.id}
                            className="p-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Aprovar"
                          >
                            {actionLoading === pedido.id ? (
                              <Loader2 className="text-white animate-spin" size={18} />
                            ) : (
                              <Check className="text-white" size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => rejeitarPedido(pedido)}
                            disabled={actionLoading === pedido.id}
                            className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                            title="Rejeitar"
                          >
                            <X className="text-white" size={18} />
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

        {abaAtiva === 'usuarios' && (
          <div className="space-y-4">
            {/* Adicionar novo usuário */}
            <form onSubmit={adicionarUsuario} className="flex gap-2">
              <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  placeholder="Adicionar email manualmente..."
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading === 'novo' || !novoEmail.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors disabled:opacity-50"
              >
                {actionLoading === 'novo' ? <Loader2 className="animate-spin" size={18} /> : 'Adicionar'}
              </button>
            </form>

            {/* Lista de usuários */}
            {loading ? (
              <div className="text-center py-12 text-slate-400">Carregando...</div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Nenhum usuário encontrado
              </div>
            ) : (
              usuariosFiltrados.map(usuario => (
                <div
                  key={usuario.id}
                  className={`bg-slate-800/50 border rounded-xl p-4 ${
                    usuario.ativo ? 'border-slate-700' : 'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{usuario.email}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          usuario.ativo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {usuario.ativo ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </div>
                      {usuario.nome && (
                        <p className="text-slate-400 text-sm">{usuario.nome}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-1">
                        Desde: {new Date(usuario.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Botão Bloquear/Desbloquear */}
                      {usuario.ativo ? (
                        <button
                          onClick={() => bloquearUsuario(usuario)}
                          disabled={actionLoading === usuario.id}
                          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                          title="Bloquear acesso"
                        >
                          {actionLoading === usuario.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            'Bloquear'
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => desbloquearUsuario(usuario)}
                          disabled={actionLoading === usuario.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm transition-colors disabled:opacity-50"
                          title="Desbloquear acesso"
                        >
                          {actionLoading === usuario.id ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            'Desbloquear'
                          )}
                        </button>
                      )}
                      
                      {/* Botão Excluir */}
                      <button
                        onClick={() => setModalExclusao(usuario)}
                        disabled={actionLoading === usuario.id}
                        className="p-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
                        title="Excluir usuário"
                      >
                        <Trash2 className="text-white" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {modalExclusao && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <h2 className="text-xl font-bold text-white">Excluir Usuário</h2>
            </div>

            <p className="text-slate-300 mb-4">
              Tem certeza que deseja excluir <strong>{modalExclusao.email}</strong>?
            </p>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-400 mb-3">Esta ação irá:</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2 text-green-400">
                  <Check size={14} /> Remover de usuarios_autorizados
                </li>
                <li className="flex items-center gap-2 text-green-400">
                  <Check size={14} /> Marcar pedidos como USUARIO_EXCLUIDO
                </li>
                <li className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle size={14} /> Dados em disciplinas: excluir no Supabase
                </li>
                <li className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle size={14} /> Conta Auth: excluir no Supabase
                </li>
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
              <p className="text-amber-300 text-sm">
                ⚠️ Para exclusão completa dos dados de notas e da conta de login, 
                você precisará excluir manualmente no painel do Supabase.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalExclusao(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => excluirUsuario(modalExclusao)}
                disabled={actionLoading === modalExclusao.id}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === modalExclusao.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <Trash2 size={18} />
                    Excluir
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
