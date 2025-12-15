import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, FileText, AlertCircle, CheckCircle, Trash2, Edit2, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const ImportModal = ({ onClose, onImport, disciplinasExistentes }) => {
  const [activeTab, setActiveTab] = useState('planilha');
  const [arquivo, setArquivo] = useState(null);
  const [textoLivre, setTextoLivre] = useState('');
  const [disciplinasPreview, setDisciplinasPreview] = useState([]);
  const [erro, setErro] = useState('');
  const [processando, setProcessando] = useState(false);
  const [editandoIndex, setEditandoIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Detectar status baseado na nota
  const detectarStatus = (nota, notaMinima = 6.0) => {
    if (nota === null || nota === undefined || nota === '') return 'NAO_INICIADA';
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum)) return 'NAO_INICIADA';
    return notaNum >= notaMinima ? 'APROVADA' : 'REPROVADA';
  };

  // Normalizar nome da disciplina
  const normalizarNome = (nome) => {
    if (!nome) return '';
    return nome.toString().trim().toUpperCase();
  };

  // Verificar se disciplina já existe
  const jaExiste = (nome) => {
    const nomeNormalizado = normalizarNome(nome);
    return disciplinasExistentes.some(d => normalizarNome(d.nome) === nomeNormalizado);
  };

  // Processar arquivo Excel/CSV
  const processarArquivo = async (file) => {
    setProcessando(true);
    setErro('');
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length < 2) {
        setErro('Arquivo vazio ou sem dados');
        setProcessando(false);
        return;
      }

      // Tentar identificar colunas pelo cabeçalho
      const header = jsonData[0].map(h => h?.toString().toLowerCase().trim() || '');
      
      const colunasMap = {
        nome: header.findIndex(h => h.includes('nome') || h.includes('disciplina') || h.includes('materia') || h.includes('matéria') || h.includes('cadeira')),
        periodo: header.findIndex(h => h.includes('periodo') || h.includes('período') || h.includes('semestre') || h.includes('fase')),
        nota: header.findIndex(h => h.includes('nota') || h.includes('media') || h.includes('média') || h.includes('final')),
        ga: header.findIndex(h => h.includes('grau a') || h.includes('ga') || h === 'a'),
        gb: header.findIndex(h => h.includes('grau b') || h.includes('gb') || h === 'b'),
        creditos: header.findIndex(h => h.includes('credito') || h.includes('crédito') || h.includes('cr')),
        cargaHoraria: header.findIndex(h => h.includes('carga') || h.includes('hora') || h.includes('ch')),
        status: header.findIndex(h => h.includes('status') || h.includes('situacao') || h.includes('situação')),
        quando: header.findIndex(h => h.includes('quando') || h.includes('data') || h.includes('ano')),
      };

      // Se não encontrou coluna de nome, tenta a segunda coluna (comum em planilhas com semestre na primeira)
      if (colunasMap.nome === -1) {
        // Se primeira coluna parece ser semestre, usa segunda como nome
        if (colunasMap.periodo === 0 || header[0]?.includes('sem')) {
          colunasMap.nome = 1;
        } else {
          colunasMap.nome = 0;
        }
      }

      // Função para parsear nota no formato brasileiro (vírgula como decimal)
      const parsearNota = (valor) => {
        if (valor === null || valor === undefined || valor === '') return null;
        if (typeof valor === 'number') return valor;
        const str = valor.toString().trim();
        if (str.toLowerCase() === 'dispensado' || str.toLowerCase() === 'aprovado') return null;
        const nota = parseFloat(str.replace(',', '.'));
        return isNaN(nota) ? null : nota;
      };

      // Extrair número do período de strings como "1° Sem", "2º Semestre", etc.
      const extrairPeriodo = (valor) => {
        if (!valor) return null;
        const str = valor.toString();
        const match = str.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          if (num >= 1 && num <= 10) return num;
        }
        return null;
      };

      const disciplinas = [];
      let periodoAtual = 1; // Para herdar período quando a célula está vazia
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row) continue;

        // Atualizar período se a coluna de período tiver valor
        if (colunasMap.periodo !== -1 && row[colunasMap.periodo]) {
          const novoPeriodo = extrairPeriodo(row[colunasMap.periodo]);
          if (novoPeriodo) periodoAtual = novoPeriodo;
        }

        const nome = row[colunasMap.nome]?.toString().trim();
        if (!nome) continue;

        const nota = colunasMap.nota !== -1 ? parsearNota(row[colunasMap.nota]) : null;
        const ga = colunasMap.ga !== -1 ? parsearNota(row[colunasMap.ga]) : null;
        const gb = colunasMap.gb !== -1 ? parsearNota(row[colunasMap.gb]) : null;
        const semestreCursado = colunasMap.quando !== -1 && row[colunasMap.quando] ? row[colunasMap.quando].toString().trim() : null;
        
        let status = 'NAO_INICIADA';
        
        if (colunasMap.status !== -1 && row[colunasMap.status]) {
          const statusTexto = row[colunasMap.status].toString().toLowerCase();
          if (statusTexto.includes('aprov') || statusTexto.includes('dispensado')) status = 'APROVADA';
          else if (statusTexto.includes('reprov')) status = 'REPROVADA';
          else if (statusTexto.includes('curso') || statusTexto.includes('cursando')) status = 'EM_CURSO';
          else if (statusTexto.includes('pendente')) status = 'NAO_INICIADA';
        } else if (nota !== null) {
          status = detectarStatus(nota);
        }

        disciplinas.push({
          nome,
          periodo: periodoAtual,
          creditos: colunasMap.creditos !== -1 ? parseInt(row[colunasMap.creditos]) || 4 : 4,
          cargaHoraria: colunasMap.cargaHoraria !== -1 ? parseInt(row[colunasMap.cargaHoraria]) || 60 : 60,
          notaMinima: 6.0,
          status,
          ga,
          gb,
          notaFinal: nota,
          semestreCursado,
          observacao: '',
          jaExiste: jaExiste(nome)
        });
      }

      if (disciplinas.length === 0) {
        setErro('Nenhuma disciplina encontrada no arquivo');
      } else {
        setDisciplinasPreview(disciplinas);
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      setErro('Erro ao ler arquivo. Verifique se é um Excel ou CSV válido.');
    }
    
    setProcessando(false);
  };

  // Processar texto livre
  const processarTexto = () => {
    setProcessando(true);
    setErro('');

    try {
      const linhas = textoLivre.split('\n').filter(l => l.trim());
      
      if (linhas.length === 0) {
        setErro('Nenhum texto para processar');
        setProcessando(false);
        return;
      }

      const disciplinas = [];

      for (const linha of linhas) {
        // Tentar diferentes formatos:
        // "Nome da Disciplina, 1, 8.5" (nome, periodo, nota)
        // "Nome da Disciplina - 1º Período - Aprovada"
        // "Nome da Disciplina    1    8.5"
        // Apenas "Nome da Disciplina"

        let nome = '', periodo = 1, nota = null, status = 'NAO_INICIADA';

        // Tentar separar por vírgula primeiro
        if (linha.includes(',')) {
          const partes = linha.split(',').map(p => p.trim());
          nome = partes[0];
          if (partes[1]) {
            const num = parseInt(partes[1]);
            if (!isNaN(num) && num >= 1 && num <= 10) periodo = num;
          }
          if (partes[2]) {
            const notaNum = parseFloat(partes[2].replace(',', '.'));
            if (!isNaN(notaNum)) {
              nota = notaNum;
              status = detectarStatus(nota);
            }
          }
        }
        // Tentar separar por ponto e vírgula
        else if (linha.includes(';')) {
          const partes = linha.split(';').map(p => p.trim());
          nome = partes[0];
          if (partes[1]) {
            const num = parseInt(partes[1]);
            if (!isNaN(num) && num >= 1 && num <= 10) periodo = num;
          }
          if (partes[2]) {
            const notaNum = parseFloat(partes[2].replace(',', '.'));
            if (!isNaN(notaNum)) {
              nota = notaNum;
              status = detectarStatus(nota);
            }
          }
        }
        // Tentar separar por tab ou múltiplos espaços
        else if (linha.includes('\t') || /\s{2,}/.test(linha)) {
          const partes = linha.split(/\t|\s{2,}/).map(p => p.trim()).filter(p => p);
          nome = partes[0];
          if (partes[1]) {
            const num = parseInt(partes[1]);
            if (!isNaN(num) && num >= 1 && num <= 10) periodo = num;
            else if (!isNaN(parseFloat(partes[1]))) {
              nota = parseFloat(partes[1]);
              status = detectarStatus(nota);
            }
          }
          if (partes[2]) {
            const notaNum = parseFloat(partes[2].replace(',', '.'));
            if (!isNaN(notaNum)) {
              nota = notaNum;
              status = detectarStatus(nota);
            }
          }
        }
        // Apenas nome
        else {
          nome = linha.trim();
        }

        // Verificar palavras-chave de status no texto
        const linhaLower = linha.toLowerCase();
        if (linhaLower.includes('aprovad')) status = 'APROVADA';
        else if (linhaLower.includes('reprovad')) status = 'REPROVADA';
        else if (linhaLower.includes('cursando') || linhaLower.includes('em curso')) status = 'EM_CURSO';

        // Tentar extrair período de texto como "1º" ou "1°" ou "período 1"
        const periodoMatch = linha.match(/(\d+)[º°]|\bperíodo\s*(\d+)|\bsemestre\s*(\d+)|\bfase\s*(\d+)/i);
        if (periodoMatch) {
          const numPeriodo = parseInt(periodoMatch[1] || periodoMatch[2] || periodoMatch[3] || periodoMatch[4]);
          if (numPeriodo >= 1 && numPeriodo <= 10) periodo = numPeriodo;
        }

        if (nome && nome.length > 2) {
          // Limpar o nome de números e status que possam ter ficado
          nome = nome.replace(/\s*-?\s*(aprovad|reprovad|cursando|em curso).*$/i, '').trim();
          nome = nome.replace(/\s*\d+[º°]\s*(período|semestre|fase)?.*$/i, '').trim();
          
          disciplinas.push({
            nome,
            periodo,
            creditos: 4,
            cargaHoraria: 60,
            notaMinima: 6.0,
            status,
            ga: null,
            gb: null,
            notaFinal: nota,
            semestreCursado: null,
            observacao: '',
            jaExiste: jaExiste(nome)
          });
        }
      }

      if (disciplinas.length === 0) {
        setErro('Nenhuma disciplina identificada. Coloque uma disciplina por linha.');
      } else {
        setDisciplinasPreview(disciplinas);
      }
    } catch (err) {
      console.error('Erro ao processar texto:', err);
      setErro('Erro ao processar texto');
    }

    setProcessando(false);
  };

  // Remover disciplina do preview
  const removerDoPreview = (index) => {
    setDisciplinasPreview(prev => prev.filter((_, i) => i !== index));
  };

  // Editar disciplina no preview
  const salvarEdicao = (index, campo, valor) => {
    setDisciplinasPreview(prev => prev.map((d, i) => {
      if (i === index) {
        const updated = { ...d, [campo]: valor };
        // Recalcular jaExiste se mudou o nome
        if (campo === 'nome') {
          updated.jaExiste = jaExiste(valor);
        }
        return updated;
      }
      return d;
    }));
  };

  // Importar disciplinas
  const handleImportar = () => {
    const paraImportar = disciplinasPreview.filter(d => !d.jaExiste);
    if (paraImportar.length === 0) {
      setErro('Nenhuma disciplina nova para importar');
      return;
    }
    
    // Remover campo jaExiste antes de importar
    const disciplinasLimpas = paraImportar.map(({ jaExiste, ...d }) => d);
    onImport(disciplinasLimpas);
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArquivo(file);
      setDisciplinasPreview([]);
      processarArquivo(file);
    }
  };

  const STATUS_OPTIONS = [
    { value: 'NAO_INICIADA', label: 'Não Iniciada', color: 'text-slate-400' },
    { value: 'EM_CURSO', label: 'Em Curso', color: 'text-blue-400' },
    { value: 'APROVADA', label: 'Aprovada', color: 'text-green-400' },
    { value: 'REPROVADA', label: 'Reprovada', color: 'text-red-400' },
  ];

  const disciplinasNovas = disciplinasPreview.filter(d => !d.jaExiste);
  const disciplinasDuplicadas = disciplinasPreview.filter(d => d.jaExiste);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload size={24} className="text-indigo-400" />
            Importar Disciplinas
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <X className="text-slate-400" size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => { setActiveTab('planilha'); setDisciplinasPreview([]); setErro(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'planilha' 
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-700/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet size={18} />
            Planilha (Excel/CSV)
          </button>
          <button
            onClick={() => { setActiveTab('texto'); setDisciplinasPreview([]); setErro(''); }}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'texto' 
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-slate-700/30' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText size={18} />
            Texto Livre
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {erro && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle size={18} />
              <span>{erro}</span>
            </div>
          )}

          {activeTab === 'planilha' && disciplinasPreview.length === 0 && (
            <div className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <FileSpreadsheet size={48} className="mx-auto text-slate-500 mb-4" />
                <p className="text-white font-medium mb-2">
                  {arquivo ? arquivo.name : 'Clique para selecionar arquivo'}
                </p>
                <p className="text-slate-400 text-sm">Excel (.xlsx, .xls) ou CSV</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Dicas:</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• A primeira linha deve conter os cabeçalhos (Nome, Período, Nota, etc.)</li>
                  <li>• Colunas reconhecidas: Nome/Disciplina, Período/Semestre, Nota/Média, Créditos, Carga Horária, Status</li>
                  <li>• Se não houver cabeçalho, a primeira coluna será considerada como nome</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'texto' && disciplinasPreview.length === 0 && (
            <div className="space-y-4">
              <textarea
                value={textoLivre}
                onChange={(e) => setTextoLivre(e.target.value)}
                placeholder={`Cole ou digite as disciplinas aqui. Exemplos de formatos aceitos:

Cálculo I, 1, 8.5
Física I; 1; 7.0
Programação    1    9.0
Algoritmos - 1º Período - Aprovada
Banco de Dados
Estrutura de Dados`}
                className="w-full h-64 bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none font-mono text-sm"
              />

              <button
                onClick={processarTexto}
                disabled={!textoLivre.trim() || processando}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {processando ? 'Processando...' : 'Processar Texto'}
              </button>

              <div className="bg-slate-700/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Formatos aceitos:</h4>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• <code className="bg-slate-600 px-1 rounded">Nome, Período, Nota</code></li>
                  <li>• <code className="bg-slate-600 px-1 rounded">Nome; Período; Nota</code></li>
                  <li>• <code className="bg-slate-600 px-1 rounded">Nome [tab] Período [tab] Nota</code></li>
                  <li>• <code className="bg-slate-600 px-1 rounded">Nome - 1º Período - Aprovada</code></li>
                  <li>• Apenas o nome da disciplina (uma por linha)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview das disciplinas */}
          {disciplinasPreview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium">
                  Preview ({disciplinasNovas.length} novas, {disciplinasDuplicadas.length} já existem)
                </h3>
                <button
                  onClick={() => { setDisciplinasPreview([]); setArquivo(null); }}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Limpar
                </button>
              </div>

              {disciplinasDuplicadas.length > 0 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
                  <AlertCircle size={16} className="inline mr-2" />
                  {disciplinasDuplicadas.length} disciplina(s) já existem e serão ignoradas
                </div>
              )}

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {disciplinasPreview.map((d, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      d.jaExiste 
                        ? 'bg-slate-700/30 border-slate-600 opacity-50' 
                        : 'bg-slate-700/50 border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        {editandoIndex === index ? (
                          <input
                            type="text"
                            value={d.nome}
                            onChange={(e) => salvarEdicao(index, 'nome', e.target.value)}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                            autoFocus
                            onBlur={() => setEditandoIndex(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditandoIndex(null)}
                          />
                        ) : (
                          <span className={`font-medium ${d.jaExiste ? 'text-slate-400 line-through' : 'text-white'}`}>
                            {d.nome}
                          </span>
                        )}
                      </div>
                      
                      <select
                        value={d.periodo}
                        onChange={(e) => salvarEdicao(index, 'periodo', parseInt(e.target.value))}
                        disabled={d.jaExiste}
                        className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm w-20"
                      >
                        {[1,2,3,4,5,6,7,8].map(p => (
                          <option key={p} value={p}>{p}º</option>
                        ))}
                      </select>

                      <select
                        value={d.status}
                        onChange={(e) => salvarEdicao(index, 'status', e.target.value)}
                        disabled={d.jaExiste}
                        className={`bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm w-32 ${
                          STATUS_OPTIONS.find(s => s.value === d.status)?.color
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>

                      {d.notaFinal !== null && (
                        <span className="text-slate-400 text-sm w-12 text-center">
                          {d.notaFinal.toFixed(1)}
                        </span>
                      )}

                      <div className="flex gap-1">
                        {!d.jaExiste && (
                          <button
                            onClick={() => setEditandoIndex(index)}
                            className="p-1 hover:bg-slate-600 rounded"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={() => removerDoPreview(index)}
                          className="p-1 hover:bg-slate-600 rounded"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>

                      {d.jaExiste && (
                        <span className="text-yellow-400 text-xs">Já existe</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {disciplinasPreview.length > 0 && (
          <div className="p-4 border-t border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportar}
              disabled={disciplinasNovas.length === 0}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Importar {disciplinasNovas.length} disciplina(s)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;
