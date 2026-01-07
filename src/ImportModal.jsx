import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, File, Loader2, Eye, EyeOff } from 'lucide-react';

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('texto'); // 'pdf', 'texto' - começar em texto que é mais confiável
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const [mostrarTextoExtraido, setMostrarTextoExtraido] = useState(false);
  const [textoExtraidoPdf, setTextoExtraidoPdf] = useState('');
  const fileInputRef = useRef(null);

  // Parser para texto colado - formato esperado:
  // Linha por linha: "Nome da Disciplina" ou "Nome da Disciplina 4 60" ou "1 60963 Nome 4 60"
  const parseTexto = useCallback((text) => {
    const disciplinas = [];
    const disciplinasAdicionadas = new Set();

    // Lista de palavras/frases para ignorar
    const palavrasIgnorar = [
      'atividades complementares',
      'quadro de atividades',
      'universidade',
      'unisinos',
      'coordenação',
      'duração',
      'reconhecimento',
      'portaria',
      'telefone',
      'e-mail',
      'observações',
      'matriz curricular',
      'habilitação',
      'bacharelado',
      'curso de',
      'seq.',
      'cred.',
      'horas-aula',
      'horas práticas',
      'horas de estágio',
      'pré-requisitos',
      'correquisitos',
      'ciência da computação',
      'grade curricular',
      'total de',
      'créditos totais'
    ];

    const linhas = text.split(/[\n\r]+/).filter(l => l.trim().length > 2);
    
    for (const linha of linhas) {
      let trimmed = linha.trim();
      
      // Ignorar linhas com palavras-chave
      const linhaLower = trimmed.toLowerCase();
      if (palavrasIgnorar.some(p => linhaLower.includes(p))) continue;
      
      // Ignorar linhas que são só números
      if (/^[\d\s,\.]+$/.test(trimmed)) continue;
      
      // Ignorar linhas muito curtas
      if (trimmed.length < 4) continue;

      let nome = '';
      let creditos = 4;
      let cargaHoraria = 60;
      let periodo = 1;

      // Padrão 1: SEMESTRE CÓDIGO NOME CRÉDITOS CARGA (ex: "1 60963 Raciocínio Lógico 4 60")
      const padraoCompleto = trimmed.match(/^([1-8])\s+(\d{5})\s+(.+?)\s+(\d{1,2})\s+(\d{2,3})(?:\s|$)/);
      if (padraoCompleto) {
        periodo = parseInt(padraoCompleto[1]);
        nome = padraoCompleto[3].trim();
        creditos = parseInt(padraoCompleto[4]);
        cargaHoraria = parseInt(padraoCompleto[5]);
      } 
      // Padrão 2: CÓDIGO NOME CRÉDITOS CARGA (ex: "60963 Raciocínio Lógico 4 60")
      else {
        const padraoCodigo = trimmed.match(/^(\d{5})\s+(.+?)\s+(\d{1,2})\s+(\d{2,3})(?:\s|$)/);
        if (padraoCodigo) {
          nome = padraoCodigo[2].trim();
          creditos = parseInt(padraoCodigo[3]);
          cargaHoraria = parseInt(padraoCodigo[4]);
        }
        // Padrão 3: NOME CRÉDITOS CARGA (ex: "Raciocínio Lógico 4 60")
        else {
          const padraoSimples = trimmed.match(/^(.+?)\s+(\d{1,2})\s+(\d{2,3})(?:\s|$)/);
          if (padraoSimples) {
            nome = padraoSimples[1].trim();
            creditos = parseInt(padraoSimples[2]);
            cargaHoraria = parseInt(padraoSimples[3]);
          }
          // Padrão 4: Só o nome (ex: "Raciocínio Lógico")
          else {
            // Remover números do início e fim
            nome = trimmed
              .replace(/^\d+\s+/, '') // Remove números do início
              .replace(/\s+\d+(\s+\d+)*\s*$/, '') // Remove números do final
              .trim();
          }
        }
      }

      // Limpar o nome
      nome = nome
        .replace(/\s+/g, ' ')
        .replace(/\s*(ou|e|,)\s*$/i, '')
        .replace(/^\d+\s*/, '')
        .trim();

      // Validações
      if (nome.length < 3 || nome.length > 150) continue;
      if (/^\d+$/.test(nome)) continue;
      if (/^[A-Z]{1,5}$/.test(nome)) continue; // Siglas isoladas
      
      const nomeLower = nome.toLowerCase();
      if (palavrasIgnorar.some(p => nomeLower.includes(p))) continue;
      if (disciplinasAdicionadas.has(nomeLower)) continue;

      // Validar créditos e carga horária
      if (creditos < 1 || creditos > 12) creditos = 4;
      if (cargaHoraria < 15 || cargaHoraria > 200) cargaHoraria = 60;

      disciplinas.push({
        nome,
        creditos,
        cargaHoraria,
        periodo,
        fonte: 'texto'
      });
      disciplinasAdicionadas.add(nomeLower);
    }

    // Ordenar por período e nome
    return disciplinas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));
  }, []);

  // Processar arquivo PDF
  const processarPdf = useCallback(async (file) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);
    setTextoExtraidoPdf('');

    try {
      // Carregar pdf.js via script tag se não estiver carregado
      if (!window.pdfjsLib) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
          };
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
        // Tentar manter a estrutura de linhas
        let ultimoY = null;
        let linhaAtual = '';
        
        for (const item of textContent.items) {
          if (ultimoY !== null && Math.abs(item.transform[5] - ultimoY) > 5) {
            textoCompleto += linhaAtual.trim() + '\n';
            linhaAtual = '';
          }
          linhaAtual += item.str + ' ';
          ultimoY = item.transform[5];
        }
        if (linhaAtual.trim()) {
          textoCompleto += linhaAtual.trim() + '\n';
        }
        textoCompleto += '\n';
      }

      setTextoExtraidoPdf(textoCompleto);
      setTexto(textoCompleto);
      const disciplinas = parseTexto(textoCompleto);
      setDisciplinasPreview(disciplinas);

      if (disciplinas.length === 0) {
        setErroPdf('Nenhuma disciplina reconhecida automaticamente. Clique em "Ver texto extraído" para copiar e ajustar manualmente na aba "Colar Texto".');
      } else if (disciplinas.length < 20) {
        setErroPdf(`Apenas ${disciplinas.length} disciplinas encontradas. Se faltam disciplinas, clique em "Ver texto extraído" para verificar.`);
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF. Tente copiar o texto do PDF manualmente e colar na aba "Colar Texto".');
    } finally {
      setProcessandoPdf(false);
    }
  }, [parseTexto]);

  // Handler para upload de arquivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        processarPdf(file);
      } else {
        setErroPdf('Por favor, selecione um arquivo PDF.');
      }
    }
  };

  // Analisar texto
  const analisarTexto = useCallback(() => {
    const disciplinas = parseTexto(texto);
    setDisciplinasPreview(disciplinas);
  }, [texto, parseTexto]);

  // Verificar duplicatas
  const verificarDuplicata = (nome) => {
    return disciplinasExistentes.some(d => 
      d.nome.toLowerCase().trim() === nome.toLowerCase().trim()
    );
  };

  // Confirmar importação
  const confirmarImportacao = () => {
    const disciplinasParaImportar = disciplinasPreview
      .filter(d => !verificarDuplicata(d.nome))
      .map(d => ({
        nome: d.nome,
        periodo: d.periodo || 1,
        creditos: d.creditos || 4,
        cargaHoraria: d.cargaHoraria || 60,
        notaMinima: 6.0,
        status: 'NAO_INICIADA',
        ga: null,
        gb: null,
        notaFinal: null,
        semestreCursado: null,
        observacao: ''
      }));

    if (disciplinasParaImportar.length > 0) {
      onImport(disciplinasParaImportar);
      onClose();
    }
  };

  const disciplinasNovas = disciplinasPreview.filter(d => !verificarDuplicata(d.nome));
  const disciplinasDuplicadas = disciplinasPreview.filter(d => verificarDuplicata(d.nome));
  
  // Agrupar por período para mostrar no preview
  const disciplinasPorPeriodo = disciplinasPreview.reduce((acc, d) => {
    const p = d.periodo || 1;
    if (!acc[p]) acc[p] = [];
    acc[p].push(d);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Upload size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Importar Cadeiras</h2>
              <p className="text-slate-400 text-sm">Cole o texto ou faça upload do PDF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10">
          <button
            onClick={() => { setModo('texto'); setDisciplinasPreview([]); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'texto' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <FileText size={18} />
            Colar Texto
          </button>
          <button
            onClick={() => { setModo('pdf'); setDisciplinasPreview([]); setErroPdf(null); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              modo === 'pdf' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <File size={18} />
            Upload PDF
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {modo === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Cole a lista de disciplinas (uma por linha)
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono"
                  placeholder={`Cole aqui a lista de disciplinas...

Formatos aceitos:
• Nome da Disciplina
• Nome da Disciplina 4 60
• 60963 Nome da Disciplina 4 60
• 1 60963 Nome da Disciplina 4 60

Exemplo:
Raciocínio Lógico 4 60
Algoritmos e Programação 8 120
Cálculo I 4 60`}
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
                <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-xs">
                  <strong>Dica:</strong> Abra o PDF no navegador, selecione todo o texto (Ctrl+A), copie (Ctrl+C) e cole aqui. 
                  Cada linha será uma disciplina. Números no final serão interpretados como créditos e carga horária.
                </p>
              </div>

              <button
                onClick={analisarTexto}
                disabled={!texto.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                Analisar Texto
              </button>
            </div>
          )}

          {modo === 'pdf' && (
            <div className="space-y-4">
              {/* Área de upload */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  processandoPdf 
                    ? 'border-amber-500/50 bg-amber-500/10' 
                    : arquivoPdf && !erroPdf
                      ? 'border-emerald-500/50 bg-emerald-500/10' 
                      : 'border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {processandoPdf ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={40} className="text-amber-400 animate-spin" />
                    <p className="text-amber-300 font-medium">Processando PDF...</p>
                    <p className="text-slate-500 text-sm">Extraindo texto do documento</p>
                  </div>
                ) : arquivoPdf ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-emerald-400" />
                    <p className="text-emerald-300 font-medium">{arquivoPdf.name}</p>
                    <p className="text-slate-500 text-sm">Clique para selecionar outro arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-slate-500" />
                    <p className="text-white font-medium">Clique para selecionar o PDF</p>
                    <p className="text-slate-500 text-sm">ou arraste o arquivo aqui</p>
                  </div>
                )}
              </div>

              {erroPdf && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-amber-300 text-sm">{erroPdf}</p>
                  </div>
                </div>
              )}

              {/* Botão para ver texto extraído */}
              {textoExtraidoPdf && (
                <div className="space-y-2">
                  <button
                    onClick={() => setMostrarTextoExtraido(!mostrarTextoExtraido)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all"
                  >
                    {mostrarTextoExtraido ? <EyeOff size={16} /> : <Eye size={16} />}
                    {mostrarTextoExtraido ? 'Ocultar texto extraído' : 'Ver texto extraído do PDF'}
                  </button>
                  
                  {mostrarTextoExtraido && (
                    <div className="space-y-2">
                      <textarea
                        value={textoExtraidoPdf}
                        readOnly
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none resize-none font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(textoExtraidoPdf);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        📋 Copiar texto
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
                <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-xs">
                  <strong>Nota:</strong> A extração automática de PDF pode não ser 100% precisa. 
                  Se faltar disciplinas, recomendamos usar a aba "Colar Texto" copiando o conteúdo do PDF manualmente.
                </p>
              </div>
            </div>
          )}

          {/* Preview */}
          {disciplinasPreview.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {disciplinasPreview.length} cadeiras encontradas
                </h3>
                <button
                  onClick={() => setExpandido(!expandido)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandido ? 'Recolher' : 'Expandir'}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{disciplinasNovas.length}</p>
                  <p className="text-xs text-slate-400">Novas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-amber-400">{disciplinasDuplicadas.length}</p>
                  <p className="text-xs text-slate-400">Duplicadas</p>
                </div>
              </div>
              
              {/* Info de semestres */}
              <div className="flex flex-wrap gap-2">
                {Object.keys(disciplinasPorPeriodo).sort((a, b) => a - b).map(p => (
                  <span key={p} className="text-xs px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {p}º sem: {disciplinasPorPeriodo[p].length}
                  </span>
                ))}
              </div>

              {/* Lista */}
              {expandido && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {disciplinasPreview.map((d, i) => {
                    const isDuplicada = verificarDuplicata(d.nome);
                    return (
                      <div
                        key={i}
                        className={`p-3 rounded-xl border ${
                          isDuplicada 
                            ? 'bg-amber-500/10 border-amber-500/30 opacity-60' 
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white font-medium text-sm">{d.nome}</p>
                              {isDuplicada && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Já existe
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{d.periodo}º sem</span>
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarImportacao}
            disabled={disciplinasNovas.length === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Importar {disciplinasNovas.length} Cadeiras
          </button>
        </div>
      </div>
    </div>
  );
}
