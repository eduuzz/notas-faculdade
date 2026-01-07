import React, { useState, useCallback, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info, File, Loader2 } from 'lucide-react';

export default function ImportModal({ onClose, onImport, disciplinasExistentes = [] }) {
  const [modo, setModo] = useState('pdf'); // 'pdf', 'texto'
  const [texto, setTexto] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [expandido, setExpandido] = useState(false);
  const [processandoPdf, setProcessandoPdf] = useState(false);
  const [arquivoPdf, setArquivoPdf] = useState(null);
  const [erroPdf, setErroPdf] = useState(null);
  const fileInputRef = useRef(null);

  // Parser para texto colado ou extraído do PDF
  const parseTexto = useCallback((text) => {
    const disciplinas = [];
    const disciplinasAdicionadas = new Set();

    // Lista de palavras/frases para ignorar no nome
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
      'correquisitos'
    ];

    // Estratégia 1: Encontrar todos os códigos de 5 dígitos e seus nomes
    // O PDF tem formato: código nome créditos cargaHoraria
    
    // Primeiro, encontrar todos os códigos de 5 dígitos
    const todosOsCodigos = text.match(/\b\d{5}\b/g) || [];
    const codigosUnicos = [...new Set(todosOsCodigos)];
    
    // Para cada código, tentar encontrar o nome da disciplina
    for (const codigo of codigosUnicos) {
      // Criar regex para encontrar o código seguido do nome
      // Padrão: código + texto até encontrar números ou fim
      const regexNome = new RegExp(codigo + '\\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s:,\\-\\.\\(\\)]+?)(?:\\s+\\d|$)', 'g');
      const matchNome = regexNome.exec(text);
      
      if (matchNome && matchNome[1]) {
        let nome = matchNome[1].trim();
        
        // Limpar o nome
        nome = nome
          .replace(/\s+/g, ' ')  // Normalizar espaços
          .replace(/\s*(ou|e|,)\s*$/i, '')  // Remover "ou", "e", "," do final
          .replace(/\s+\d+.*$/, '')  // Remover números do final
          .trim();
        
        // Validações
        if (nome.length < 3 || nome.length > 120) continue;
        if (/^\d+$/.test(nome)) continue;
        if (/^[A-Z]{2,5}$/.test(nome)) continue; // Siglas isoladas
        
        const nomeLower = nome.toLowerCase();
        if (palavrasIgnorar.some(p => nomeLower.includes(p))) continue;
        
        // Evitar duplicatas
        if (disciplinasAdicionadas.has(codigo)) continue;
        
        // Tentar extrair créditos e carga horária próximos ao código
        const contextRegex = new RegExp(codigo + '\\s+' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(\\d)\\s+(\\d{2,3})', 'i');
        const contextMatch = contextRegex.exec(text);
        
        let creditos = 4;
        let cargaHoraria = 60;
        
        if (contextMatch) {
          creditos = parseInt(contextMatch[1]) || 4;
          cargaHoraria = parseInt(contextMatch[2]) || 60;
        }
        
        disciplinas.push({
          nome,
          creditos: creditos >= 1 && creditos <= 12 ? creditos : 4,
          cargaHoraria: cargaHoraria >= 15 && cargaHoraria <= 200 ? cargaHoraria : 60,
          periodo: 1,
          fonte: 'pdf'
        });
        disciplinasAdicionadas.add(codigo);
      }
    }

    // Estratégia 2: Se não encontrou muitas, tentar linha por linha (para texto colado manualmente)
    if (disciplinas.length < 10) {
      const linhas = text.split(/[\n\r]+/).filter(l => l.trim().length > 3);
      
      for (const linha of linhas) {
        const trimmed = linha.trim();
        
        // Ignorar linhas com palavras-chave
        const linhaLower = trimmed.toLowerCase();
        if (palavrasIgnorar.some(p => linhaLower.includes(p))) continue;
        
        // Tentar extrair: pode ter código no início ou não
        let nome = trimmed;
        let creditos = 4;
        let cargaHoraria = 60;
        
        // Remover código do início se houver
        nome = nome.replace(/^\d{5}\s+/, '');
        
        // Remover números do final (créditos, carga horária, etc)
        const matchNumeros = nome.match(/^(.+?)\s+(\d{1,2})\s+(\d{2,3})(?:\s+\d+)*\s*$/);
        if (matchNumeros) {
          nome = matchNumeros[1];
          creditos = parseInt(matchNumeros[2]) || 4;
          cargaHoraria = parseInt(matchNumeros[3]) || 60;
        } else {
          nome = nome.replace(/\s+\d+\s*$/g, '').replace(/\s+\d+\s+\d+.*$/, '');
        }
        
        nome = nome.trim();
        
        // Validações
        if (nome.length < 3 || nome.length > 120) continue;
        if (/^\d+$/.test(nome)) continue;
        if (/^[A-Z]{2,5}$/.test(nome)) continue;
        
        const nomeLower = nome.toLowerCase();
        if (disciplinasAdicionadas.has(nomeLower)) continue;
        
        disciplinas.push({
          nome,
          creditos: creditos >= 1 && creditos <= 12 ? creditos : 4,
          cargaHoraria: cargaHoraria >= 15 && cargaHoraria <= 200 ? cargaHoraria : 60,
          periodo: 1,
          fonte: 'texto'
        });
        disciplinasAdicionadas.add(nomeLower);
      }
    }

    return disciplinas;
  }, []);

  // Processar arquivo PDF
  const processarPdf = useCallback(async (file) => {
    setProcessandoPdf(true);
    setErroPdf(null);
    setArquivoPdf(file);

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
        const pageText = textContent.items.map(item => item.str).join(' ');
        textoCompleto += pageText + '\n';
      }

      setTexto(textoCompleto);
      const disciplinas = parseTexto(textoCompleto);
      setDisciplinasPreview(disciplinas);

      if (disciplinas.length === 0) {
        setErroPdf('Nenhuma disciplina reconhecida. Tente copiar o texto do PDF e colar na aba "Colar Texto".');
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setErroPdf('Erro ao ler o PDF. Tente copiar o texto do PDF e colar na aba "Colar Texto".');
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
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
                ) : arquivoPdf && !erroPdf ? (
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
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Erro ao processar</p>
                    <p className="text-red-200/70 text-sm">{erroPdf}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} />
                <span>O sistema extrai automaticamente os nomes das disciplinas do PDF</span>
              </div>
            </div>
          )}

          {modo === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  Cole o texto das cadeiras (do PDF ou site)
                </label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50 resize-none font-mono"
                  placeholder="Cole aqui o texto com as disciplinas...&#10;&#10;Exemplo:&#10;Cálculo I&#10;Física I&#10;Programação I&#10;&#10;Ou com créditos:&#10;Cálculo I    4    60&#10;Física I    4    60"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Info size={14} />
                <span>Cada linha será interpretada como uma disciplina</span>
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
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">{d.nome}</p>
                              {isDuplicada && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                  Já existe
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
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
