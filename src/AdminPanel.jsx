import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { 
  Shield, Users, Clock, CheckCircle, XCircle, 
  ArrowLeft, RefreshCw, Search, Mail, Trash2, UserPlus,
  ExternalLink, AlertCircle
} from 'lucide-react';

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

  useEffect(() => {
    if (isAdmin) carregarDados();
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: pedidosData } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
      if (pedidosData) setPedidos(pedidosData);
      const { data: usuariosData } = await supabase.from('usuarios_autorizados').select('*').order('created_at', { ascending: false });
      if (usuariosData) setUsuarios(usuariosData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const aprovarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    setErro(''); setSucesso('');
    try {
      const jaAutorizado = usuarios.find(u => u.email === pedido.email.toLowerCase());
      if (!jaAutorizado) {
        const { error: insertError } = await supabase.from('usuarios_autorizados').insert([{ email: pedido.email.toLowerCase(), ativo: true, nome: pedido.nome }]);
        if (insertError) { setErro('Erro ao autorizar: ' + insertError.message); setActionLoading(null); return; }
      }
      const { error: updateError } = await supabase.from('pedidos').update({ status: 'APROVADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
      if (updateError) setErro('Erro ao aprovar');
      else { setSucesso(`Pedido de ${pedido.nome} aprovado!`); carregarDados(); }
    } catch (err) { setErro('Erro inesperado'); }
    setActionLoading(null);
  };

  const rejeitarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    try {
      await supabase.from('pedidos').update({ status: 'REJEITADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
      carregarDados();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const adicionarUsuario = async (e) => {
    e.preventDefault();
    if (!novoEmail.trim()) return;
    setActionLoading('novo'); setErro(''); setSucesso('');
    try {
      const { error } = await supabase.from('usuarios_autorizados').insert([{ email: novoEmail.trim().toLowerCase(), ativo: true }]);
      if (error) setErro(error.code === '23505' ? 'Email já cadastrado' : error.message);
      else { setSucesso('Usuário adicionado!'); setNovoEmail(''); carregarDados(); }
    } catch (err) { setErro('Erro inesperado'); }
    setActionLoading(null);
  };

  const removerUsuario = async (usuario) => {
    if (!confirm(`Remover ${usuario.email}?`)) return;
    setActionLoading(usuario.id);
    await supabase.from('usuarios_autorizados').delete().eq('id', usuario.id);
    carregarDados();
    setActionLoading(null);
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.email.toLowerCase().includes(busca.toLowerCase());
    return matchBusca && (filtroStatus === 'TODOS' || p.status === filtroStatus);
  });

  const usuariosFiltrados = usuarios.filter(u => u.email.toLowerCase().includes(busca.toLowerCase()) || (u.nome && u.nome.toLowerCase().includes(busca.toLowerCase())));

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto text-red-400 mb-4" size={48} />
        <h1 className="text-xl text-white mb-2">Acesso Negado</h1>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><ArrowLeft className="text-slate-400" size={20} /></button>
            <div className="flex items-center gap-2"><Shield className="text-indigo-400" size={24} /><h1 className="text-xl font-bold text-white">Painel Admin</h1></div>
          </div>
          <button onClick={carregarDados} disabled={loading} className="p-2 hover:bg-slate-700 rounded-lg"><RefreshCw className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} size={20} /></button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'pedidos' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Clock size={18} />Pedidos{pedidos.filter(p => p.status === 'PENDENTE').length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pedidos.filter(p => p.status === 'PENDENTE').length}</span>}
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Users size={18} />Usuários ({usuarios.length})
          </button>
        </div>
        {erro && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"><AlertCircle size={18} />{erro}</div>}
        {sucesso && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"><CheckCircle size={18} />{sucesso}</div>}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
          </div>
          {activeTab === 'pedidos' && <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"><option value="TODOS">Todos</option><option value="PENDENTE">Pendentes</option><option value="APROVADO">Aprovados</option><option value="REJEITADO">Rejeitados</option></select>}
        </div>
        {loading ? <div className="text-center py-12"><RefreshCw className="mx-auto text-indigo-400 animate-spin mb-4" size={32} /><p className="text-slate-400">Carregando...</p></div>
        : activeTab === 'pedidos' ? (
          <div className="space-y-4">
            {pedidosFiltrados.length === 0 ? <div className="text-center py-12 text-slate-400">Nenhum pedido</div> : pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className={`bg-slate-800/50 border rounded-xl p-4 ${pedido.status === 'PENDENTE' ? 'border-yellow-500/30' : pedido.status === 'APROVADO' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{pedido.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pedido.status === 'PENDENTE' ? 'bg-yellow-500/20 text-yellow-400' : pedido.status === 'APROVADO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pedido.status}</span>
                    </div>
                    <div className="text-slate-400 text-sm flex items-center gap-1"><Mail size={14} />{pedido.email}</div>
                    <div className="text-slate-500 text-xs mt-1">{new Date(pedido.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pedido.comprovante_url && <a href={pedido.comprovante_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"><ExternalLink className="text-slate-300" size={18} /></a>}
                    {pedido.status === 'PENDENTE' && <>
                      <button onClick={() => aprovarPedido(pedido)} disabled={actionLoading === pedido.id} className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg"><CheckCircle className="text-white" size={18} /></button>
                      <button onClick={() => rejeitarPedido(pedido)} disabled={actionLoading === pedido.id} className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg"><XCircle className="text-white" size={18} /></button>
                    </>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={adicionarUsuario} className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="Adicionar email..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" disabled={actionLoading === 'novo' || !novoEmail.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg flex items-center gap-2"><UserPlus size={18} />Adicionar</button>
            </form>
            {usuariosFiltrados.length === 0 ? <div className="text-center py-12 text-slate-400">Nenhum usuário</div> : usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{usuario.email}</div>
                  {usuario.nome && <div className="text-slate-400 text-sm">{usuario.nome}</div>}
                  <div className="text-slate-500 text-xs mt-1">Desde {new Date(usuario.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <button onClick={() => removerUsuario(usuario)} disabled={actionLoading === usuario.id || usuario.email === ADMIN_EMAIL} className="p-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 rounded-lg"><Trash2 className="text-red-400" size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
ENDOFFILEcat > src/AdminPanel.jsx << 'ENDOFFILE'
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import { 
  Shield, Users, Clock, CheckCircle, XCircle, 
  ArrowLeft, RefreshCw, Search, Mail, Trash2, UserPlus,
  ExternalLink, AlertCircle
} from 'lucide-react';

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

  useEffect(() => {
    if (isAdmin) carregarDados();
  }, [isAdmin]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: pedidosData } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
      if (pedidosData) setPedidos(pedidosData);
      const { data: usuariosData } = await supabase.from('usuarios_autorizados').select('*').order('created_at', { ascending: false });
      if (usuariosData) setUsuarios(usuariosData);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const aprovarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    setErro(''); setSucesso('');
    try {
      const jaAutorizado = usuarios.find(u => u.email === pedido.email.toLowerCase());
      if (!jaAutorizado) {
        const { error: insertError } = await supabase.from('usuarios_autorizados').insert([{ email: pedido.email.toLowerCase(), ativo: true, nome: pedido.nome }]);
        if (insertError) { setErro('Erro ao autorizar: ' + insertError.message); setActionLoading(null); return; }
      }
      const { error: updateError } = await supabase.from('pedidos').update({ status: 'APROVADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
      if (updateError) setErro('Erro ao aprovar');
      else { setSucesso(`Pedido de ${pedido.nome} aprovado!`); carregarDados(); }
    } catch (err) { setErro('Erro inesperado'); }
    setActionLoading(null);
  };

  const rejeitarPedido = async (pedido) => {
    setActionLoading(pedido.id);
    try {
      await supabase.from('pedidos').update({ status: 'REJEITADO', updated_at: new Date().toISOString() }).eq('id', pedido.id);
      carregarDados();
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const adicionarUsuario = async (e) => {
    e.preventDefault();
    if (!novoEmail.trim()) return;
    setActionLoading('novo'); setErro(''); setSucesso('');
    try {
      const { error } = await supabase.from('usuarios_autorizados').insert([{ email: novoEmail.trim().toLowerCase(), ativo: true }]);
      if (error) setErro(error.code === '23505' ? 'Email já cadastrado' : error.message);
      else { setSucesso('Usuário adicionado!'); setNovoEmail(''); carregarDados(); }
    } catch (err) { setErro('Erro inesperado'); }
    setActionLoading(null);
  };

  const removerUsuario = async (usuario) => {
    if (!confirm(`Remover ${usuario.email}?`)) return;
    setActionLoading(usuario.id);
    await supabase.from('usuarios_autorizados').delete().eq('id', usuario.id);
    carregarDados();
    setActionLoading(null);
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase()) || p.email.toLowerCase().includes(busca.toLowerCase());
    return matchBusca && (filtroStatus === 'TODOS' || p.status === filtroStatus);
  });

  const usuariosFiltrados = usuarios.filter(u => u.email.toLowerCase().includes(busca.toLowerCase()) || (u.nome && u.nome.toLowerCase().includes(busca.toLowerCase())));

  if (!isAdmin) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto text-red-400 mb-4" size={48} />
        <h1 className="text-xl text-white mb-2">Acesso Negado</h1>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">Voltar</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="bg-slate-800/50 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg"><ArrowLeft className="text-slate-400" size={20} /></button>
            <div className="flex items-center gap-2"><Shield className="text-indigo-400" size={24} /><h1 className="text-xl font-bold text-white">Painel Admin</h1></div>
          </div>
          <button onClick={carregarDados} disabled={loading} className="p-2 hover:bg-slate-700 rounded-lg"><RefreshCw className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} size={20} /></button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'pedidos' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Clock size={18} />Pedidos{pedidos.filter(p => p.status === 'PENDENTE').length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pedidos.filter(p => p.status === 'PENDENTE').length}</span>}
          </button>
          <button onClick={() => setActiveTab('usuarios')} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${activeTab === 'usuarios' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            <Users size={18} />Usuários ({usuarios.length})
          </button>
        </div>
        {erro && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400"><AlertCircle size={18} />{erro}</div>}
        {sucesso && <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400"><CheckCircle size={18} />{sucesso}</div>}
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
          </div>
          {activeTab === 'pedidos' && <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white"><option value="TODOS">Todos</option><option value="PENDENTE">Pendentes</option><option value="APROVADO">Aprovados</option><option value="REJEITADO">Rejeitados</option></select>}
        </div>
        {loading ? <div className="text-center py-12"><RefreshCw className="mx-auto text-indigo-400 animate-spin mb-4" size={32} /><p className="text-slate-400">Carregando...</p></div>
        : activeTab === 'pedidos' ? (
          <div className="space-y-4">
            {pedidosFiltrados.length === 0 ? <div className="text-center py-12 text-slate-400">Nenhum pedido</div> : pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className={`bg-slate-800/50 border rounded-xl p-4 ${pedido.status === 'PENDENTE' ? 'border-yellow-500/30' : pedido.status === 'APROVADO' ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{pedido.nome}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${pedido.status === 'PENDENTE' ? 'bg-yellow-500/20 text-yellow-400' : pedido.status === 'APROVADO' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{pedido.status}</span>
                    </div>
                    <div className="text-slate-400 text-sm flex items-center gap-1"><Mail size={14} />{pedido.email}</div>
                    <div className="text-slate-500 text-xs mt-1">{new Date(pedido.created_at).toLocaleString('pt-BR')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pedido.comprovante_url && <a href={pedido.comprovante_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg"><ExternalLink className="text-slate-300" size={18} /></a>}
                    {pedido.status === 'PENDENTE' && <>
                      <button onClick={() => aprovarPedido(pedido)} disabled={actionLoading === pedido.id} className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg"><CheckCircle className="text-white" size={18} /></button>
                      <button onClick={() => rejeitarPedido(pedido)} disabled={actionLoading === pedido.id} className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg"><XCircle className="text-white" size={18} /></button>
                    </>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={adicionarUsuario} className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="Adicionar email..." className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" disabled={actionLoading === 'novo' || !novoEmail.trim()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white rounded-lg flex items-center gap-2"><UserPlus size={18} />Adicionar</button>
            </form>
            {usuariosFiltrados.length === 0 ? <div className="text-center py-12 text-slate-400">Nenhum usuário</div> : usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">{usuario.email}</div>
                  {usuario.nome && <div className="text-slate-400 text-sm">{usuario.nome}</div>}
                  <div className="text-slate-500 text-xs mt-1">Desde {new Date(usuario.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <button onClick={() => removerUsuario(usuario)} disabled={actionLoading === usuario.id || usuario.email === ADMIN_EMAIL} className="p-2 bg-red-600/20 hover:bg-red-600/40 disabled:opacity-50 rounded-lg"><Trash2 className="text-red-400" size={18} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
