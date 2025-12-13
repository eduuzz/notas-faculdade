import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { Shield, Users, Clock, CheckCircle, XCircle, ArrowLeft, RefreshCw, Search, Mail, Trash2, UserPlus, ExternalLink, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL = 'eproencad@gmail.com';

const AdminPanel = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [pedidos, setPedidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [novoEmail, setNovoEmail] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => { if (isAdmin) carregarDados(); }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    const { data: p } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (p) setPedidos(p);
    const { data: u } = await supabase.from('usuarios_autorizados').select('*').order('created_at', { ascending: false });
    if (u) setUsuarios(u);
    setLoading(false);
  };

  const aprovarPedido = async (pedido) => {
    setActionLoading(pedido.id); setErro(''); setSucesso('');
    const jaAutorizado = usuarios.find(u => u.email === pedido.email.toLowerCase());
    if (!jaAutorizado) {
      const { error } = await supabase.from('usuarios_autorizados').insert([{ email: pedido.email.toLowerCase(), ativo: true, nome: pedido.nome }]);
      if (error) { setErro('Erro: ' + error.message); setActionLoading(null); return; }
    }
    await supabase.from('pedidos').update({ status: 'APROVADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
    setSucesso('Aprovado!'); carregarDados(); setActionLoading(null);
  };

  const rejeitarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    await supabase.from('pedidos').update({ status: 'REJEITADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
    carregarDados(); setActionLoading(null);
  };

  const adicionarUsuario = async (e) => {
    e.preventDefault(); if (!novoEmail.trim()) return;
    setActionLoading('novo'); setErro(''); setSucesso('');
    const { error } = await supabase.from('usuarios_autorizados').insert([{ email: novoEmail.trim().toLowerCase(), ativo: true }]);
    if (error) setErro(error.code === '23505' ? 'Email já existe' : error.message);
    else { setSucesso('Adicionado!'); setNovoEmail(''); carregarDados(); }
    setActionLoading(null);
  };

  const removerUsuario = async (usuario) => {
    if (!confirm('Remover ' + usuario.email + '?')) return;
    setActionLoading(usuario.id);
    await supabase.from('usuarios_autorizados').delete().eq('id', usuario.id);
    carregarDados(); setActionLoading(null);
  };

  const pedidosFiltrados = pedidos.filter(p => (p.nome.toLowerCase().includes(busca.toLowerCase()) || p.email.toLowerCase().includes(busca.toLowerCase())) && (filtroStatus === 'TODOS' || p.status === filtroStatus));
  const usuariosFiltrados = usuarios.filter(u => u.email.toLowerCase().includes(busca.toLowerCase()));

  if (!isAdmin) return (<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-center"><Shield className="mx-auto text-red-400 mb-4" size={48} /><h1 className="text-xl text-white mb-2">Acesso Negado</h1><button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg">Voltar</button></div></div>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/50 border-b border-slate-700"><div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><ArrowLeft className="text-slate-400" size={20} /></button><Shield className="text-indigo-400" size={24} /><h1 className="text-xl font-bold text-white">Painel Admin</h1></div><button onClick={carregarDados} className="p-2 hover:bg-slate-700 rounded-lg"><RefreshCw className={loading ? 'animate-spin text-slate-400' : 'text-slate-400'} size={20} /></button></div></div>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'pedidos' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}><Clock size={18} />Pedidos{pedidos.filter(p => p.status === 'PENDENTE').length > 0 && <span className="bg-red-500 text-white text-xs px-2 rounded-full">{pedidos.filter(p => p.status === 'PENDENTE').length}</span>}</button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}><Users size={18} />Usuários ({usuarios.length})</button>
        </div>
        {erro && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2"><AlertCircle size={18} />{erro}</div>}
        {sucesso && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2"><CheckCircle size={18} />{sucesso}</div>}
        <div className="mb-4 flex gap-4"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" /></div>{activeTab === 'pedidos' && <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"><option value="TODOS">Todos</option><option value="PENDENTE">Pendentes</option><option value="APROVADO">Aprovados</option><option value="REJEITADO">Rejeitados</option></select>}</div>
        {loading ? <div className="text-center py-12"><RefreshCw className="mx-auto text-indigo-400 animate-spin" size={32} /></div> : activeTab === 'pedidos' ? (
          <div className="space-y-4">{pedidosFiltrados.length === 0 ? <p className="text-center py-12 text-slate-400">Nenhum pedido</p> : pedidosFiltrados.map(p => (<div key={p.id} className={`bg-slate-800/50 border rounded-xl p-4 ${p.status === 'PENDENTE' ? 'border-yellow-500/30' : p.status === 'APROVADO' ? 'border-green-500/30' : 'border-red-500/30'}`}><div className="flex justify-between"><div><div className="flex items-center gap-2 mb-1"><span className="font-medium text-white">{p.nome}</span><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === 'PENDENTE' ? 'bg-yellow-500/20 text-yellow-400' : p.status === 'APROVADO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{p.status}</span></div><div className="text-slate-400 text-sm">{p.email}</div><div className="text-slate-500 text-xs mt-1">{new Date(p.created_at).toLocaleString('pt-BR')}</div></div><div className="flex items-center gap-2">{p.comprovante_url && <a href={p.comprovante_url} target="_blank" className="p-2 bg-slate-700 rounded-lg"><ExternalLink className="text-slate-300" size={18} /></a>}{p.status === 'PENDENTE' && <><button onClick={() => aprovarPedido(p)} disabled={actionLoading === p.id} className="p-2 bg-green-600 rounded-lg"><CheckCircle className="text-white" size={18} /></button><button onClick={() => rejeitarPedido(p)} disabled={actionLoading === p.id} className="p-2 bg-red-600 rounded-lg"><XCircle className="text-white" size={18} /></button></>}</div></div></div>))}</div>
        ) : (
          <div className="space-y-4"><form onSubmit={adicionarUsuario} className="flex gap-2"><div className="flex-1 relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="Adicionar email..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white" /></div><button type="submit" disabled={!novoEmail.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"><UserPlus size={18} />Adicionar</button></form>{usuariosFiltrados.map(u => (<div key={u.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between"><div><div className="font-medium text-white">{u.email}</div><div className="text-slate-500 text-xs">Desde {new Date(u.created_at).toLocaleDateString('pt-BR')}</div></div><button onClick={() => removerUsuario(u)} disabled={u.email === ADMIN_EMAIL} className="p-2 bg-red-600/20 rounded-lg"><Trash2 className="text-red-400" size={18} /></button></div>))}</div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
