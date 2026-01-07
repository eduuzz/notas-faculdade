import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, File, Loader2, Eye, EyeOff, Sparkles, Zap } from 'lucide-react';

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('texto');
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const [mostrarTextoExtraido, setMostrarTextoExtraido] = useState(false);
  const [textoExtraidoPdf, setTextoExtraidoPdf] = useState('');
  const [filtroObrigatorias, setFiltroObrigatorias] = useState(true);
  const [filtroTrilhas, setFiltroTrilhas] = useState(false);
  const [filtroOptativas, setFiltroOptativas] = useState(false);
  const fileInputRef = useRef(null);

  const analisarComIA = useCallback(async (textoParaAnalisar) => {
    setProcessandoIA(true);
    setErroPdf(null);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          messages: [{
            role: 'user',
            content: `Analise este texto de grade curricular e extraia as disciplinas. Retorne APENAS JSON: {"disciplinas":[{"codigo":"60963","nome":"Nome","creditos":4,"cargaHoraria":60,"periodo":1}]}. Texto: ${textoParaAnalisar.substring(0, 20000)}`
          }]
        })
      });
      if (!response.ok) throw new Error('Erro na API');
      const data = await response.json();
      const conteudo = data.content[0].text;
      const jsonMatch = conteudo.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const resultado = JSON.parse(jsonMatch[0]);
        if (resultado.disciplinas && Array.isArray(resultado.disciplinas)) {
          const codigosVistos = new Set();
          const disciplinasProcessadas = resultado.disciplinas
            .filter(d => { if (!d.codigo || codigosVistos.has(d.codigo)) return false; codigosVistos.add(d.codigo); return true; })
            .map(d => ({ codigo: d.codigo, nome: d.nome, creditos: d.creditos || 4, cargaHoraria: d.cargaHoraria || 60, periodo: d.periodo || 1, tipo: d.periodo <= 10 ? 'obrigatoria' : d.periodo <= 14 ? 'trilha' : 'optativa', fonte: 'ia' }));
          setDisciplinasPreview(disciplinasProcessadas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome)));
          return true;
        }
      }
      throw new Error('Formato inválido');
    } catch (error) {
      console.error('Erro na análise IA:', error);
      setErroPdf('Erro na análise inteligente. Tente o modo manual.');
      return false;
    } finally {
      setProcessandoIA(false);
    }
  }, []);

  const parseTextoManual = useCallback((text) => {
    const disciplinas = [];
    const codigosAdicionados = new Set();
    const nomesAdicionados = new Set();
    const ignorarLinhas = ['seq.', 'cred.', 'horas-aula', 'horas práticas', 'pré-requisitos', 'correquisitos', 'obs.', 'atividades acadêmicas', 'universidade', 'unisinos', 'coordenação', 'reconhecimento', 'portaria', 'duração', 'telefone', 'e-mail', 'observações', 'quadro de atividades', 'atividades complementares', 'grupos', 'paridade', 'limite máximo', 'horas extraclasse', 'horas de estágio', 'ch teórica', 'ch de prática', 'projetos aplicados da trilha', 'optativas da trilha', 'cod.'];
    const nomesGenericos = ['atividades complementares', 'livre escolha', 'atividade optativa'];
    const ehTrilha = (nome) => {
      const n = nome.toLowerCase();
      return n.includes('projeto aplicado') || n.includes('trilha') || n.includes('modelagem de negócios') || n.includes('consolidação do modelo') || n.includes('design e gestão para inovação') || n.includes('soluções criativas') || n.includes('atividade no mestrado');
    };
    const linhas = text.split(/[\n\r]+/);
    let semestreAtual = 1;
    let secaoAtual = 'obrigatoria';
    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (trimmed.length < 5) continue;
      const linhaLower = trimmed.toLowerCase();
      if (ignorarLinhas.some(p => linhaLower.startsWith(p) || linhaLower === p)) continue;
      if (linhaLower.includes('trilha empreendedorismo')) { secaoAtual = 'trilha'; semestreAtual = 11; continue; }
      if (linhaLower.includes('trilha inovação social')) { secaoAtual = 'trilha'; semestreAtual = 12; continue; }
      if (linhaLower.includes('trilha internacionalização')) { secaoAtual = 'trilha'; semestreAtual = 13; continue; }
      if (linhaLower.includes('trilha mestrado')) { secaoAtual = 'trilha'; semestreAtual = 14; continue; }
      if (linhaLower.includes('trilhas específicas') || linhaLower.includes('trilha específica')) { secaoAtual = 'optativa'; semestreAtual = 15; continue; }
      const matchInicioCodigo = trimmed.match(/^(\d{5})\s+(.+)/);
      if (matchInicioCodigo) {
        const codigo = matchInicioCodigo[1];
        if (codigosAdicionados.has(codigo)) continue;
        const resto = matchInicioCodigo[2].trim();
        const tokens = resto.split(/\s+/);
        let indiceFimNome = tokens.length;
        let numerosFinais = [];
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(tokens[i])) { numerosFinais.unshift(parseInt(tokens[i])); indiceFimNome = i; }
          else if (numerosFinais.length > 0) break;
        }
        let nome = tokens.slice(0, indiceFimNome).join(' ').trim().replace(/\s+(ou|OU|e|,)\s*$/i, '').replace(/\s+/g, ' ').trim();
        let creditos = 4, cargaHoraria = 60;
        if (numerosFinais.length >= 1) {
          for (const num of numerosFinais) {
            if (num >= 1 && num <= 8 && creditos === 4) creditos = num;
            else if (num >= 15 && num <= 200 && cargaHoraria === 60) { cargaHoraria = num; break; }
          }
        }
        if (nome.length >= 3 && nome.length <= 200 && !/^\d+$/.test(nome)) {
          const nomeLower = nome.toLowerCase();
          if (!nomesAdicionados.has(nomeLower) && !nomesGenericos.some(g => nomeLower.includes(g))) {
            let tipo = secaoAtual, periodo = semestreAtual;
            if (ehTrilha(nome) && secaoAtual === 'obrigatoria') { tipo = 'trilha'; periodo = 11; }
            disciplinas.push({ codigo, nome, creditos, cargaHoraria, periodo, tipo, fonte: 'manual' });
            codigosAdicionados.add(codigo);
            nomesAdicionados.add(nomeLower);
          }
        }
        continue;
      }
      const codigoMatch = trimmed.match(/\b(\d{5})\b/);
      if (codigoMatch) {
        const codigo = codigoMatch[1];
        if (codigosAdicionados.has(codigo)) continue;
        const antesCodigo = trimmed.substring(0, codigoMatch.index).trim();
        const semMatch = antesCodigo.match(/^(\d{1,2})$/);
        if (semMatch && secaoAtual === 'obrigatoria') { const sem = parseInt(semMatch[1]); if (sem >= 1 && sem <= 10) semestreAtual = sem; }
        const depoisCodigo = trimmed.substring(codigoMatch.index + 5).trim();
        const tokens = depoisCodigo.split(/\s+/);
        let indiceFimNome = tokens.length;
        let numerosFinais = [];
        for (let i = tokens.length - 1; i >= 0; i--) {
          if (/^\d+$/.test(tokens[i])) { numerosFinais.unshift(parseInt(tokens[i])); indiceFimNome = i; }
          else if (numerosFinais.length > 0) break;
        }
        let nome = tokens.slice(0, indiceFimNome).join(' ').trim().replace(/\s+(ou|OU|e|,)\s*$/i, '').replace(/\s+\d+\s*$/, '').replace(/\s+/g, ' ').trim();
        let creditos = 4, cargaHoraria = 60;
        if (numerosFinais.length >= 2) {
          for (const num of numerosFinais) {
            if (num >= 1 && num <= 8 && creditos === 4) creditos = num;
            else if (num >= 15 && num <= 200 && cargaHoraria === 60) { cargaHoraria = num; break; }
          }
        } else if (numerosFinais.length === 1) {
          const num = numerosFinais[0];
          if (num >= 15 && num <= 200) cargaHoraria = num;
          else if (num >= 1 && num <= 8) creditos = num;
        }
        if (nome.length < 3 || nome.length > 200) continue;
        if (/^\d+$/.test(nome)) continue;
        if (nomesGenericos.some(g => nome.toLowerCase().includes(g))) continue;
        const nomeLower = nome.toLowerCase();
        if (nomesAdicionados.has(nomeLower)) continue;
        let tipo = secaoAtual, periodo = semestreAtual;
        if (secaoAtual === 'obrigatoria' && ehTrilha(nome)) { tipo = 'trilha'; periodo = 11; }
        disciplinas.push({ codigo, nome, creditos, cargaHoraria, periodo, tipo, fonte: 'manual' });
        codigosAdicionados.add(codigo);
        nomesAdicionados.add(nomeLower);
      }
    }
    return disciplinas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));
  }, []);

  const processarPdf = useCallback(async (file, usarIA = true) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);
    setTextoExtraidoPdf('');
    setDisciplinasPreview([]);
    try {
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(); };
          script.onerror = () => reject(new Error('Falha ao carregar pdf.js'));
          document.head.appendChild(script);
        });
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let textoCompleto = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let ultimoY = null, linhaAtual = '';
        for (const item of textContent.items) {
          if (ultimoY !== null && Math.abs(item.transform[5] - ultimoY) > 5) { textoCompleto += linhaAtual.trim() + '\n'; linhaAtual = ''; }
          linhaAtual += item.str + ' ';
          ultimoY = item.transform[5];
        }
        if (linhaAtual.trim()) textoCompleto += linhaAtual.trim() + '\n';
        textoCompleto += '\n';
      }
      setTextoExtraidoPdf(textoCompleto);
      setTexto(textoCompleto);
      setProcessandoPdf(false);
      if (usarIA) {
        const sucesso = await analisarComIA(textoCompleto);
        if (!sucesso) {
          const disciplinas = parseTextoManual(textoCompleto);
          setDisciplinasPreview(disciplinas);
          if (disciplinas.length === 0) setErroPdf('Nenhuma disciplina encontrada.');
        }
      } else {
        const disciplinas = parseTextoManual(textoCompleto);
        setDisciplinasPreview(disciplinas);
        if (disciplinas.length === 0) setErroPdf('Nenhuma disciplina encontrada.');
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF.');
      setProcessandoPdf(false);
    }
  }, [analisarComIA, parseTextoManual]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') processarPdf(file, true);
    else setErroPdf('Por favor, selecione um arquivo PDF.');
  };

  const analisarTexto = useCallback(async (usarIA = false) => {
    if (usarIA) await analisarComIA(texto);
    else { const disciplinas = parseTextoManual(texto); setDisciplinasPreview(disciplinas); }
  }, [texto, analisarComIA, parseTextoManual]);

  const verificarDuplicata = (d) => disciplinasExistentes.some(e => e.nome.toLowerCase().trim() === d.nome.toLowerCase().trim());

  const getNomePeriodo = (periodo) => {
    if (periodo >= 1 && periodo <= 10) return `${periodo}º Semestre`;
    if (periodo === 11) return 'Trilha Empreendedorismo';
    if (periodo === 12) return 'Trilha Inovação Social';
    if (periodo === 13) return 'Trilha Internacionalização';
    if (periodo === 14) return 'Trilha Mestrado';
    if (periodo === 15) return 'Optativas do Curso';
    return `Período ${periodo}`;
  };

  const disciplinasFiltradas = disciplinasPreview.filter(d => {
    if (d.tipo === 'obrigatoria' && filtroObrigatorias) return true;
    if (d.tipo === 'trilha' && filtroTrilhas) return true;
    if (d.tipo === 'optativa' && filtroOptativas) return true;
    return false;
  });

  const contagens = {
    obrigatorias: disciplinasPreview.filter(d => d.tipo === 'obrigatoria').length,
    trilhas: disciplinasPreview.filter(d => d.tipo === 'trilha').length,
    optativas: disciplinasPreview.filter(d => d.tipo === 'optativa').length
  };

  const confirmarImportacao = () => {
    const disciplinasParaImportar = disciplinasFiltradas.filter(d => !verificarDuplicata(d)).map(d => ({
      nome: d.nome, periodo: d.periodo, creditos: d.creditos || 4, cargaHoraria: d.cargaHoraria || 60,
      notaMinima: 6.0, status: 'NAO_INICIADA', ga: null, gb: null, notaFinal: null, semestreCursado: null, observacao: ''
    }));
    if (disciplinasParaImportar.length > 0) { onImport(disciplinasParaImportar); onClose(); }
  };

  const disciplinasNovas = disciplinasFiltradas.filter(d => !verificarDuplicata(d));
  const disciplinasDuplicadas = disciplinasFiltradas.filter(d => verificarDuplicata(d));
  const disciplinasPorPeriodo = disciplinasFiltradas.reduce((acc, d) => { const p = d.periodo || 1; if (!acc[p]) acc[p] = []; acc[p].push(d); return acc; }, {});
  const isProcessando = processandoPdf || processandoIA;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Upload size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importar Cadeiras</h2>
              <p className="text-slate-400 text-sm">Análise inteligente com IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-white/10">
          <button onClick={() => { setModo('texto'); setDisciplinasPreview([]); }} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${modo === 'texto' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
            <FileText size={18} /> Colar Texto
          </button>
          <button onClick={() => { setModo('pdf'); setDisciplinasPreview([]); setErroPdf(null); }} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${modo === 'pdf' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
            <File size={18} /> Upload PDF
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {modo === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">Cole a lista de disciplinas</label>
                <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={8} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono" placeholder="Cole aqui o texto do PDF..." />
              </div>
              <div className="flex gap-2">
                <button onClick={() => analisarTexto(true)} disabled={!texto.trim() || isProcessando} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {processandoIA ? <><Loader2 size={18} className="animate-spin" /> Analisando...</> : <><Sparkles size={18} /> Análise com IA</>}
                </button>
                <button onClick={() => analisarTexto(false)} disabled={!texto.trim() || isProcessando} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-all disabled:opacity-50" title="Análise manual"><Zap size={18} /></button>
              </div>
            </div>
          )}

          {modo === 'pdf' && (
            <div className="space-y-4">
              <div onClick={() => !isProcessando && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isProcessando ? 'border-violet-500/50 bg-violet-500/10' : arquivoPdf && disciplinasPreview.length > 0 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/20 hover:border-amber-500/50'}`}>
                <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                {processandoPdf ? <div className="flex flex-col items-center gap-3"><Loader2 size={40} className="text-amber-400 animate-spin" /><p className="text-amber-300 font-medium">Extraindo texto...</p></div>
                  : processandoIA ? <div className="flex flex-col items-center gap-3"><Sparkles size={40} className="text-violet-400 animate-pulse" /><p className="text-violet-300 font-medium">IA analisando...</p></div>
                  : arquivoPdf && disciplinasPreview.length > 0 ? <div className="flex flex-col items-center gap-3"><CheckCircle size={40} className="text-emerald-400" /><p className="text-emerald-300 font-medium">{arquivoPdf.name}</p><p className="text-slate-500 text-sm">Clique para selecionar outro</p></div>
                  : <div className="flex flex-col items-center gap-3"><Upload size={40} className="text-slate-500" /><p className="text-white font-medium">Clique para selecionar o PDF</p></div>}
              </div>
              {erroPdf && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3"><AlertCircle size={20} className="text-amber-400" /><p className="text-amber-300 text-sm">{erroPdf}</p></div>}
              {textoExtraidoPdf && (
                <div className="space-y-2">
                  <button onClick={() => setMostrarTextoExtraido(!mostrarTextoExtraido)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                    {mostrarTextoExtraido ? <EyeOff size={16} /> : <Eye size={16} />} {mostrarTextoExtraido ? 'Ocultar' : 'Ver'} texto extraído
                  </button>
                  {mostrarTextoExtraido && <textarea value={textoExtraidoPdf} readOnly rows={6} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono" />}
                </div>
              )}
            </div>
          )}

          {disciplinasPreview.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {disciplinasPreview.length} cadeiras encontradas
                  {disciplinasPreview[0]?.fonte === 'ia' && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30"><Sparkles size={10} className="inline mr-1" />via IA</span>}
                </h3>
                <button onClick={() => setExpandido(!expandido)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                  {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {expandido ? 'Recolher' : 'Expandir'}
                </button>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                <p className="text-sm text-slate-400 font-medium">Selecione o que importar:</p>
                <div className="flex flex-wrap gap-3">
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${filtroObrigatorias ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={filtroObrigatorias} onChange={(e) => setFiltroObrigatorias(e.target.checked)} className="w-4 h-4 rounded accent-emerald-500" />
                    <span className="text-sm text-white">Obrigatórias</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">{contagens.obrigatorias}</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${filtroTrilhas ? 'bg-violet-500/20 border border-violet-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={filtroTrilhas} onChange={(e) => setFiltroTrilhas(e.target.checked)} className="w-4 h-4 rounded accent-violet-500" />
                    <span className="text-sm text-white">Trilhas</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/30 text-violet-300">{contagens.trilhas}</span>
                  </label>
                  <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${filtroOptativas ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={filtroOptativas} onChange={(e) => setFiltroOptativas(e.target.checked)} className="w-4 h-4 rounded accent-amber-500" />
                    <span className="text-sm text-white">Optativas</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">{contagens.optativas}</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{disciplinasNovas.length}</p>
                  <p className="text-xs text-slate-400">Serão importadas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{disciplinasDuplicadas.length}</p>
                  <p className="text-xs text-slate-400">Já existem</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.keys(disciplinasPorPeriodo).sort((a, b) => Number(a) - Number(b)).map(p => (
                  <span key={p} className={`text-xs px-2 py-1 rounded-lg border ${Number(p) <= 10 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : Number(p) <= 14 ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    {getNomePeriodo(Number(p))}: {disciplinasPorPeriodo[p].length}
                  </span>
                ))}
              </div>

              {expandido && disciplinasFiltradas.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {disciplinasFiltradas.map((d, i) => {
                    const isDuplicada = verificarDuplicata(d);
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isDuplicada ? 'bg-amber-500/10 border-amber-500/30 opacity-60' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {d.codigo && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{d.codigo}</span>}
                              <p className="text-white font-medium text-sm truncate">{d.nome}</p>
                              {isDuplicada && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Já existe</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className={`px-1.5 py-0.5 rounded ${d.tipo === 'obrigatoria' ? 'bg-emerald-500/20 text-emerald-400' : d.tipo === 'trilha' ? 'bg-violet-500/20 text-violet-400' : 'bg-amber-500/20 text-amber-400'}`}>{getNomePeriodo(d.periodo)}</span>
                              <span>{d.creditos} cr</span>
                              <span>{d.cargaHoraria}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {disciplinasFiltradas.length === 0 && <div className="text-center py-4 text-slate-500"><p>Selecione pelo menos um tipo de disciplina para importar</p></div>}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-all">Cancelar</button>
          <button onClick={confirmarImportacao} disabled={disciplinasNovas.length === 0 || isProcessando} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50">
            Importar {disciplinasNovas.length} Cadeiras
          </button>
        </div>
      </div>
    </div>
  );
}
