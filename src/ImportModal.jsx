import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, File, Loader2, Eye, EyeOff, Zap } from 'lucide-react';

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('texto'); // 'pdf', 'texto'
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const [mostrarTextoExtraido, setMostrarTextoExtraido] = useState(false);
  const [textoExtraidoPdf, setTextoExtraidoPdf] = useState('');
  const fileInputRef = useRef(null);

  // Parser para texto - APENAS disciplinas com código de 5 dígitos
  const parseTexto = useCallback((text) => {
    const disciplinas = [];
    const codigosAdicionados = new Set();

    // Palavras que indicam que a linha NÃO é uma disciplina
    const palavrasIgnorar = [
      'atividades complementares', 'quadro de atividades', 'universidade',
      'unisinos', 'coordenação', 'duração', 'reconhecimento', 'portaria',
      'telefone', 'e-mail', 'observações', 'matriz curricular', 'habilitação',
      'bacharelado', 'curso de', 'seq.', 'cred.', 'horas-aula', 'horas práticas',
      'horas de estágio', 'pré-requisitos', 'correquisitos', 'ciência da computação',
      'grade curricular', 'total de', 'créditos totais', 'atividades acadêmicas',
      'obs.', 'n.'
    ];

    const linhas = text.split(/[\n\r]+/);
    
    for (const linha of linhas) {
      const trimmed = linha.trim();
      if (trimmed.length < 10) continue;
      
      const linhaLower = trimmed.toLowerCase();
      
      // Ignorar cabeçalhos
      if (palavrasIgnorar.some(p => linhaLower.startsWith(p) || linhaLower === p)) continue;

      // OBRIGATÓRIO: deve conter código de 5 dígitos
      // Padrão esperado: [semestre] CÓDIGO NOME [créditos] [carga] [outros números]
      // Exemplo: "1 60963 Raciocínio Lógico 4 60 30"
      // Exemplo: "60963 Raciocínio Lógico 4 60"
      
      // Primeiro, encontrar o código de 5 dígitos na linha
      const codigoMatch = trimmed.match(/\b(\d{5})\b/);
      if (!codigoMatch) continue;
      
      const codigo = codigoMatch[1];
      if (codigosAdicionados.has(codigo)) continue;
      
      // Extrair semestre (número de 1 dígito antes do código)
      const antesCodigo = trimmed.substring(0, codigoMatch.index).trim();
      const semestreMatch = antesCodigo.match(/^(\d)$/);
      const semestre = semestreMatch ? parseInt(semestreMatch[1]) : 1;
      
      // Extrair o resto após o código
      const depoisCodigo = trimmed.substring(codigoMatch.index + 5).trim();
      
      // Regex para extrair: NOME seguido de números (créditos, carga, etc)
      // O nome vai até encontrar uma sequência de números
      const nomeMatch = depoisCodigo.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s:,\-\.\(\)\/]+?)(?:\s+(\d{1,2})\s+(\d{2,3}))?/);
      
      if (!nomeMatch) continue;
      
      let nome = nomeMatch[1].trim();
      const creditos = nomeMatch[2] ? parseInt(nomeMatch[2]) : 4;
      const cargaHoraria = nomeMatch[3] ? parseInt(nomeMatch[3]) : 60;
      
      // Limpar nome
      nome = nome
        .replace(/\s+/g, ' ')
        .replace(/\s*(ou|e|,)\s*$/i, '')
        .replace(/\d+\s*$/, '')
        .trim();
      
      // Validações
      if (nome.length < 3 || nome.length > 150) continue;
      if (/^\d+$/.test(nome)) continue;
      if (/^[a-z\s]+$/i.test(nome) && nome.split(' ').length < 2) continue; // Palavras soltas

      disciplinas.push({
        codigo,
        nome,
        creditos: creditos >= 1 && creditos <= 12 ? creditos : 4,
        cargaHoraria: cargaHoraria >= 15 && cargaHoraria <= 200 ? cargaHoraria : 60,
        periodo: semestre >= 1 && semestre <= 9 ? semestre : 1,
        preRequisitos: [],
        coRequisitos: [],
        fonte: 'texto'
      });
      codigosAdicionados.add(codigo);
    }

    return disciplinas.sort((a, b) => a.periodo - b.periodo || a.nome.localeCompare(b.nome));
  }, []);

  // Processar arquivo PDF
  const processarPdf = useCallback(async (file) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);
    setTextoExtraidoPdf('');
    setDisciplinasPreview([]);

    try {
      // Carregar pdf.js
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
      
      // Processar com parser
      const disciplinas = parseTexto(textoCompleto);
      setDisciplinasPreview(disciplinas);
      
      if (disciplinas.length === 0) {
        setErroPdf('Nenhuma disciplina com código encontrada. Verifique o texto extraído.');
      } else if (disciplinas.length < 10) {
        setErroPdf(`Apenas ${disciplinas.length} disciplinas encontradas. Verifique se o PDF tem o formato esperado.`);
      }

    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF. Tente copiar o texto manualmente.');
    } finally {
      setProcessandoPdf(false);
    }
  }, [parseTexto]);

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

  const analisarTexto = useCallback(() => {
    const disciplinas = parseTexto(texto);
    setDisciplinasPreview(disciplinas);
    
    if (disciplinas.length === 0) {
      setErroPdf('Nenhuma disciplina com código de 5 dígitos encontrada.');
    } else {
      setErroPdf(null);
    }
  }, [texto, parseTexto]);

  const verificarDuplicata = (d) => {
    // Verificar por código (se existir) ou por nome
    return disciplinasExistentes.some(existente => 
      (d.codigo && existente.codigo === d.codigo) ||
      existente.nome.toLowerCase().trim() === d.nome.toLowerCase().trim()
    );
  };

  const confirmarImportacao = () => {
    const disciplinasParaImportar = disciplinasPreview
      .filter(d => !verificarDuplicata(d))
      .map(d => {
        // Criar objeto base com campos obrigatórios
        const disciplina = {
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
        };
        
        // Adicionar campos opcionais apenas se existirem
        if (d.codigo) {
          disciplina.codigo = d.codigo;
        }
        if (d.preRequisitos && d.preRequisitos.length > 0) {
          disciplina.preRequisitos = d.preRequisitos;
        }
        if (d.coRequisitos && d.coRequisitos.length > 0) {
          disciplina.coRequisitos = d.coRequisitos;
        }
        
        return disciplina;
      });

    if (disciplinasParaImportar.length > 0) {
      onImport(disciplinasParaImportar);
      onClose();
    }
  };

  const disciplinasNovas = disciplinasPreview.filter(d => !verificarDuplicata(d));
  const disciplinasDuplicadas = disciplinasPreview.filter(d => verificarDuplicata(d));
  
  const disciplinasPorPeriodo = disciplinasPreview.reduce((acc, d) => {
    const p = d.periodo || 1;
    if (!acc[p]) acc[p] = [];
    acc[p].push(d);
    return acc;
  }, {});

  const isProcessando = processandoPdf || processandoIA;

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
              <p className="text-slate-400 text-sm">Upload de PDF ou cole o texto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-white/10">
          <button
            onClick={() => { setModo('texto'); setDisciplinasPreview([]); setErroPdf(null); }}
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
                  Cole a lista de disciplinas (com código de 5 dígitos)
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono"
                  placeholder={`Cole o texto do PDF aqui...

Formato esperado (cada linha):
SEMESTRE CÓDIGO NOME CRÉDITOS CARGA

Exemplo:
1 60963 Raciocínio Lógico 4 60
1 60964 Algoritmos e Programação: Fundamentos 8 120
2 60966 Algoritmos e Programação: Estruturas Lineares 8 120`}
                />
              </div>

              <button
                onClick={analisarTexto}
                disabled={!texto.trim() || processandoPdf}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Analisar Texto
              </button>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-2">
                <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-blue-300 text-xs">
                  <strong>Importante:</strong> As disciplinas devem ter código de 5 dígitos (ex: 60963). Linhas sem código serão ignoradas.
                </p>
              </div>

              {erroPdf && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-300 text-sm">{erroPdf}</p>
                </div>
              )}
            </div>
          )}

          {modo === 'pdf' && (
            <div className="space-y-4">
              <div
                onClick={() => !processandoPdf && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  processandoPdf 
                    ? 'border-amber-500/50 bg-amber-500/10 cursor-wait' 
                    : arquivoPdf && disciplinasPreview.length > 0
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
                    <p className="text-slate-500 text-sm">Extraindo e analisando texto</p>
                  </div>
                ) : arquivoPdf && disciplinasPreview.length > 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle size={40} className="text-emerald-400" />
                    <p className="text-emerald-300 font-medium">{arquivoPdf.name}</p>
                    <p className="text-slate-500 text-sm">Clique para selecionar outro arquivo</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={40} className="text-slate-500" />
                    <p className="text-white font-medium">Clique para selecionar o PDF</p>
                    <p className="text-slate-500 text-sm">Grade curricular com códigos de 5 dígitos</p>
                  </div>
                )}
              </div>

              {erroPdf && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-300 text-sm">{erroPdf}</p>
                </div>
              )}

              {textoExtraidoPdf && (
                <div className="space-y-2">
                  <button
                    onClick={() => setMostrarTextoExtraido(!mostrarTextoExtraido)}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-all"
                  >
                    {mostrarTextoExtraido ? <EyeOff size={16} /> : <Eye size={16} />}
                    {mostrarTextoExtraido ? 'Ocultar texto extraído' : 'Ver texto extraído'}
                  </button>
                  
                  {mostrarTextoExtraido && (
                    <div className="space-y-2">
                      <textarea
                        value={textoExtraidoPdf}
                        readOnly
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none resize-none font-mono"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigator.clipboard.writeText(textoExtraidoPdf)}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          📋 Copiar texto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {disciplinasPreview.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
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
              
              <div className="flex flex-wrap gap-2">
                {Object.keys(disciplinasPorPeriodo).sort((a, b) => a - b).map(p => (
                  <span key={p} className="text-xs px-2 py-1 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {p === '0' ? 'Optativas' : p === '9' ? 'Trilhas' : `${p}º sem`}: {disciplinasPorPeriodo[p].length}
                  </span>
                ))}
              </div>

              {expandido && (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                  {disciplinasPreview.map((d, i) => {
                    const isDuplicada = verificarDuplicata(d);
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {d.codigo && (
                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                  {d.codigo}
                                </span>
                              )}
                              <p className="text-white font-medium text-sm truncate">{d.nome}</p>
                              {isDuplicada && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Já existe
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span>{d.periodo === 0 ? 'Optativa' : d.periodo >= 9 ? 'Trilha' : `${d.periodo}º sem`}</span>
                              <span>{d.creditos} cr</span>
                              <span>{d.cargaHoraria}h</span>
                              {d.preRequisitos && d.preRequisitos.length > 0 && (
                                <span className="text-amber-400" title={`Pré-req: ${d.preRequisitos.join(', ')}`}>
                                  📋 {d.preRequisitos.length} pré-req
                                </span>
                              )}
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
            disabled={disciplinasNovas.length === 0 || isProcessando}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            Importar {disciplinasNovas.length} Cadeiras
          </button>
        </div>
      </div>
    </div>
  );
}
